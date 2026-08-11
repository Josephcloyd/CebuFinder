import axios from 'axios'
import type { BusinessCategory } from '../lib/constants/business-categories'
import { getErrorMessage } from '../lib/utils/errors'

interface OverpassElement {
  id: number
  type: 'node' | 'way' | 'relation'
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export interface DiscoveredBusiness {
  name: string
  businessCategory: string
  description?: string
  barangay: string
  city: string
  province: string
  latitude?: number
  longitude?: number
  discoverySource: 'OSM_OVERPASS' | 'GOOGLE_SEARCH_API' | 'BING_SEARCH_API' | 'MANUAL_ENTRY'
  sourceUrl?: string
  websiteUrl?: string
  facebookUrl?: string
  phone?: string
}

// Maps our standard category names to OSM amenity/shop key-values
const CATEGORY_MAP: Record<BusinessCategory, { tags: { key: string; values: string[] }[] }> = {
  'Dental Clinic': { tags: [{ key: 'amenity', values: ['dentist'] }] },
  'Medical Clinic': { tags: [{ key: 'amenity', values: ['clinic', 'doctors', 'hospital'] }] },
  'Coffee Shop': { tags: [{ key: 'amenity', values: ['cafe'] }] },
  'Hardware Store': { tags: [{ key: 'shop', values: ['hardware', 'doityourself', 'trade'] }] },
  'Restaurant': { tags: [{ key: 'amenity', values: ['restaurant', 'fast_food', 'food_court'] }] },
  'Auto Repair': { tags: [{ key: 'shop', values: ['car_repair', 'car_parts', 'tyres'] }] },
  'Salon': { tags: [{ key: 'shop', values: ['hairdresser', 'beauty', 'barber'] }] },
  'Gym / Fitness': { tags: [{ key: 'leisure', values: ['fitness_centre', 'sports_centre'] }] },
  'Veterinary Clinic': { tags: [{ key: 'amenity', values: ['veterinary'] }] },
  'Accounting Office': { tags: [{ key: 'office', values: ['accountant'] }] },
  'Law Office': { tags: [{ key: 'office', values: ['lawyer'] }] },
  'Massage / Spa': {
    tags: [
      { key: 'shop', values: ['massage'] },
      { key: 'leisure', values: ['spa'] },
    ],
  },
}

// Maps standard city names to OSM area names and provinces
export const CITY_OSM_MAP: Record<string, { osmName: string; province: string }> = {
  'Cebu City': { osmName: 'Cebu City', province: 'Cebu' },
  'Naga City': { osmName: 'City of Naga', province: 'Cebu' },
  'Merida': { osmName: 'Merida', province: 'Leyte' },
  'Ormoc City': { osmName: 'Ormoc', province: 'Leyte' },
  'Mandaue City': { osmName: 'Mandaue', province: 'Cebu' },
  'Lapu-Lapu City': { osmName: 'Lapu-Lapu', province: 'Cebu' },
  'Talisay City': { osmName: 'Talisay', province: 'Cebu' },
}

export class DiscoveryService {
  private static OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ]

  /**
   * Generates the Overpass QL query for a specific Category, Barangay, and City
   */
  private static buildOverpassQuery(category: string, barangay: string | undefined, city: string): string {
    const config = CATEGORY_MAP[category as BusinessCategory]
    if (!config) {
      throw new Error(`Category "${category}" is not configured for OpenStreetMap discovery.`)
    }

    const cityConfig = CITY_OSM_MAP[city] || { osmName: city, province: 'Cebu' }
    const osmAreaName = cityConfig.osmName

    const unionBlocks = config.tags
      .flatMap(({ key, values }) => values.map((val) => {
        return `
          node["${key}"="${val}"](area.searchArea);
          way["${key}"="${val}"](area.searchArea);
        `
      }))
      .join('\n')

    return `
      [out:json][timeout:25];
      area[name="${osmAreaName}"]->.searchArea;
      (
        ${unionBlocks}
      );
      out center;
    `
  }

  /**
   * Fetches businesses from OpenStreetMap using the Overpass API
   */
  public static async discoverFromOSM(
    category: string,
    barangay?: string,
    city: string = 'Cebu City'
  ): Promise<DiscoveredBusiness[]> {
    const cityConfig = CITY_OSM_MAP[city] || { osmName: city, province: 'Cebu' }
    const province = cityConfig.province

    const query = this.buildOverpassQuery(category, barangay, city)
    
    let lastError: unknown = null
    let responseData: OverpassResponse | null = null

    // Try primary endpoint and mirrors with appropriate User-Agent headers
    for (const endpoint of this.OVERPASS_ENDPOINTS) {
      try {
        // Overpass API prefers GET requests with data parameter
        const getUrl = `${endpoint}?data=${encodeURIComponent(query)}`
        const res = await axios.get<OverpassResponse>(getUrl, {
          headers: {
            'User-Agent': 'CebuDigitalFinderBot/1.0 (https://cebudigitalfinder.com)',
            'Accept': 'application/json',
          },
          timeout: 30000,
        })

        if (res.data && res.data.elements) {
          responseData = res.data
          break
        }
      } catch (err: unknown) {
        console.warn(`Overpass endpoint GET warning (${endpoint}): ${getErrorMessage(err)}`)
        lastError = err

        // Fallback try POST request for this endpoint
        try {
          const res = await axios.post<OverpassResponse>(
            endpoint,
            `data=${encodeURIComponent(query)}`,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'CebuDigitalFinderBot/1.0 (https://cebudigitalfinder.com)',
                'Accept': 'application/json',
              },
              timeout: 30000,
            }
          )

          if (res.data && res.data.elements) {
            responseData = res.data
            break
          }
        } catch (postErr: unknown) {
          console.warn(`Overpass endpoint POST warning (${endpoint}): ${getErrorMessage(postErr)}`)
          lastError = postErr
        }
      }
    }

    if (!responseData || !responseData.elements) {
      if (lastError) {
        console.error(`Overpass API Error for Category: ${category}, City: ${city}, Barangay: ${barangay}:`, getErrorMessage(lastError))
      }
      return []
    }

      const elements = responseData.elements
      const results: DiscoveredBusiness[] = []

      for (const element of elements) {
        const tags = element.tags || {}
        const name = tags.name
        
        if (!name) continue // Drop anonymous elements

        // Determine coordinates
        let lat = element.lat
        let lon = element.lon
        
        // If it's a way/polygon, Overpass 'out center' returns a 'center' block
        if (element.type === 'way' && element.center) {
          lat = element.center.lat
          lon = element.center.lon
        }

        // Suburb validation: if a specific barangay was searched, filter elements that don't match
        const tagSuburb = tags['addr:suburb'] || tags['addr:neighborhood'] || ''
        const tagStreet = tags['addr:street'] || ''
        
        if (
          barangay &&
          tagSuburb &&
          !tagSuburb.toLowerCase().includes(barangay.toLowerCase()) &&
          !tagStreet.toLowerCase().includes(barangay.toLowerCase())
        ) {
          continue
        }

        // Parse public phone numbers
        const rawPhone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || undefined

        results.push({
          name,
          businessCategory: category,
          description: tags.description || tags.note || undefined,
          barangay: tagSuburb || barangay || 'City-wide',
          city: tags['addr:city'] || city,
          province: tags['addr:province'] || province,
          latitude: lat,
          longitude: lon,
          discoverySource: 'OSM_OVERPASS',
          sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
          websiteUrl: tags.website || tags['contact:website'] || undefined,
          facebookUrl: tags['contact:facebook'] || undefined,
          phone: rawPhone,
        })
      }

      return results
  }
}
