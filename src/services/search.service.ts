import axios from 'axios'
import { DiscoveredBusiness } from './discovery.service'

interface GoogleSearchItem {
  title: string
  link: string
  snippet: string
}

export class SearchService {
  /**
   * Search Google Custom Search API for businesses of a category in a barangay.
   * Query format: e.g., "Dental Clinic" "Lahug" "Cebu City"
   */
  public static async searchGoogle(category: string, barangay: string): Promise<DiscoveredBusiness[]> {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const cseId = process.env.GOOGLE_CSE_ID

    if (!apiKey || !cseId) {
      console.warn('Google Custom Search API credentials missing. Falling back to empty results (or simulated in development).')
      if (process.env.NODE_ENV === 'development') {
        return this.generateSimulatedLeads(category, barangay)
      }
      return []
    }

    const query = `"${category}" "${barangay}" "Cebu City"`
    const url = `https://customsearch.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cseId}`

    try {
      const response = await axios.get(url, { timeout: 10000 })
      const items: GoogleSearchItem[] = response.data.items || []
      
      const results: DiscoveredBusiness[] = []

      for (const item of items) {
        // Simple extraction heuristic:
        // Try to identify the business name from the title
        // Title format is usually: "Business Name - Location - Subtitle" or similar
        const titleParts = item.title.split(/[-|•]/)
        const name = titleParts[0]?.trim() || item.title
        
        // Skip links that are directories or irrelevant
        const link = item.link.toLowerCase()
        if (
          link.includes('yellow-pages') ||
          link.includes('tripadvisor') ||
          link.includes('foursquare') ||
          link.includes('map') ||
          link.includes('job')
        ) {
          continue
        }

        let facebookUrl: string | undefined = undefined
        let websiteUrl: string | undefined = undefined

        if (link.includes('facebook.com/')) {
          facebookUrl = item.link
        } else {
          websiteUrl = item.link
        }

        results.push({
          name,
          businessCategory: category,
          barangay,
          city: 'Cebu City',
          province: 'Cebu',
          discoverySource: 'GOOGLE_SEARCH_API',
          sourceUrl: item.link,
          websiteUrl,
          facebookUrl,
        })
      }

      return results
    } catch (error: any) {
      console.error('Google Search API Error:', error.message)
      throw error
    }
  }

  /**
   * Generates high-quality simulated leads in development mode to enable testing.
   */
  private static generateSimulatedLeads(category: string, barangay: string): DiscoveredBusiness[] {
    console.log(`Generating simulated leads for "${category}" in "${barangay}"...`)
    
    if (category === 'Dental Clinic') {
      return [
        {
          name: 'Cebu Smile Dental Care',
          businessCategory: 'Dental Clinic',
          description: 'A modern dental clinic providing quality dental services in Cebu.',
          barangay,
          city: 'Cebu City',
          province: 'Cebu',
          latitude: 10.3204,
          longitude: 123.9054,
          discoverySource: 'GOOGLE_SEARCH_API',
          sourceUrl: 'https://m.facebook.com/cebusmiledentalcare/',
          facebookUrl: 'https://www.facebook.com/cebusmiledentalcare/',
          phone: '09173001234',
        },
        {
          name: 'Mabolo Family Dentist',
          businessCategory: 'Dental Clinic',
          description: 'Caring for your family smiles since 2018.',
          barangay: 'Mabolo',
          city: 'Cebu City',
          province: 'Cebu',
          latitude: 10.3235,
          longitude: 123.9112,
          discoverySource: 'GOOGLE_SEARCH_API',
          sourceUrl: 'https://mabolo-family-dentist-ph.co',
          websiteUrl: 'http://mabolo-family-dentist-ph.co', // Old website, offline or insecure
          phone: '0322314567',
        }
      ]
    }

    if (category === 'Restaurant') {
      return [
        {
          name: 'Kusina de Cebu',
          businessCategory: 'Restaurant',
          description: 'Authentic Cebuano dishes, lechon, and seafood.',
          barangay,
          city: 'Cebu City',
          province: 'Cebu',
          latitude: 10.3188,
          longitude: 123.8966,
          discoverySource: 'GOOGLE_SEARCH_API',
          sourceUrl: 'https://www.facebook.com/kusinadecebu/',
          facebookUrl: 'https://www.facebook.com/kusinadecebu/',
          phone: '09187654321',
        }
      ]
    }

    return [
      {
        name: `Local ${category} Hub`,
        businessCategory: category,
        description: 'Quality local business services.',
        barangay,
        city: 'Cebu City',
        province: 'Cebu',
        discoverySource: 'GOOGLE_SEARCH_API',
        sourceUrl: 'https://www.facebook.com/localhub/',
        facebookUrl: 'https://www.facebook.com/localhub/',
      }
    ]
  }
}
