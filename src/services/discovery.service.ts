import axios from 'axios'

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
const CATEGORY_MAP: Record<string, { key: string; values: string[] }> = {
  'Restaurant': { key: 'amenity', values: ['restaurant', 'cafe', 'fast_food', 'food_court'] },
  'Dental Clinic': { key: 'amenity', values: ['dentist'] },
  'Medical Clinic': { key: 'amenity', values: ['clinic', 'doctors', 'hospital'] },
  'Salon': { key: 'shop', values: ['hairdresser', 'beauty', 'barber'] },
  'Gym': { key: 'leisure', values: ['fitness_centre', 'sports_centre'] },
}

export class DiscoveryService {
  private static OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

  /**
   * Generates the Overpass QL query for a specific Category and Barangay in Cebu City
   */
  private static buildOverpassQuery(category: string, barangay: string): string {
    const config = CATEGORY_MAP[category]
    if (!config) {
      throw new Error(`Category "${category}" is not configured for OpenStreetMap discovery.`)
    }

    const { key, values } = config
    const unionBlocks = values
      .map((val) => {
        // Query elements with the key=value inside Cebu City, matching the specific suburb (barangay)
        return `
          node["${key}"="${val}"]["addr:suburb"~"${barangay}",i](area.cebu);
          way["${key}"="${val}"]["addr:suburb"~"${barangay}",i](area.cebu);
          // Fallback: also query elements within the bounding box of Cebu and filter by address or proximity later if suburb is blank
          node["${key}"="${val}"](area.cebu);
          way["${key}"="${val}"](area.cebu);
        `
      })
      .join('\n')

    return `
      [out:json][timeout:60];
      area[name="Cebu City"]->.cebu;
      (
        ${unionBlocks}
      );
      out center;
    `
  }

  /**
   * Fetches businesses from OpenStreetMap using the Overpass API
   */
  public static async discoverFromOSM(category: string, barangay: string): Promise<DiscoveredBusiness[]> {
    const query = this.buildOverpassQuery(category, barangay)
    
    try {
      const response = await axios.post(
        this.OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 45000,
        }
      )

      if (!response.data || !response.data.elements) {
        return []
      }

      const elements = response.data.elements
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

        // Suburb validation: Since we fetched elements in Cebu City, check if suburb tag matches
        // or matches barangay name in address field.
        const tagSuburb = tags['addr:suburb'] || tags['addr:neighborhood'] || ''
        const tagStreet = tags['addr:street'] || ''
        
        // Skip if a specific barangay was requested, the element has a suburb tag, and it doesn't match
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
          barangay: tagSuburb || barangay, // Fallback to searched barangay
          city: tags['addr:city'] || 'Cebu City',
          province: tags['addr:province'] || 'Cebu',
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
    } catch (error: any) {
      console.error(`Overpass API Error for Category: ${category}, Barangay: ${barangay}:`, error.message)
      throw error
    }
  }
}
