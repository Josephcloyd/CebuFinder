import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'
import { getAnthropicClient } from '../../../../lib/ai/client'
import { BUSINESS_CATEGORIES, matchBusinessCategory } from '../../../../lib/constants/business-categories'

// Helper to normalize strings for comparison
const cleanText = (str: string) => str.toLowerCase().trim()

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Messages array is required.' }, { status: 400 })
    }

    const lastUserMessage = messages[messages.length - 1].content

    // 1. Fetch DB aggregates to build system prompt / context
    const totalLeads = await prisma.business.count()
    
    const barangayCounts = await prisma.business.groupBy({
      by: ['barangay'],
      _count: { id: true },
    })

    const categoryCounts = await prisma.business.groupBy({
      by: ['businessCategory'],
      _count: { id: true },
    })

    const statusCounts = await prisma.digitalPresence.groupBy({
      by: ['websiteStatus'],
      _count: { id: true },
    })

    const outreachCounts = await prisma.outreach.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const barangaySummary = barangayCounts.map(b => `${b.barangay}: ${b._count.id}`).join(', ')
    const categorySummary = categoryCounts.map(c => `${c.businessCategory}: ${c._count.id}`).join(', ')
    const statusSummary = statusCounts.map(s => `${s.websiteStatus}: ${s._count.id}`).join(', ')
    const outreachSummary = outreachCounts.map(o => `${o.status}: ${o._count.id}`).join(', ')

    // 2. Check if ANTHROPIC_API_KEY is configured
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      // AI-Powered Mode (Claude 3.5 Haiku)
      const systemPrompt = `You are a helpful, professional, and friendly AI growth assistant for Cebu Digital Finder.
You assist the user in exploring the CRM leads database, reviewing audit results, and launching campaigns.

Current database summary:
- Total Leads Discovered: ${totalLeads}
- Distribution by Barangay: ${barangaySummary || 'None'}
- Distribution by Category: ${categorySummary || 'None'}
- Lead Website Statuses: ${statusSummary || 'None'}
- Outreach Statuses: ${outreachSummary || 'None'}

Capabilities you can trigger:
1. Launch campaign: If the user wants to start or run a search/discovery campaign, output this action block in your response: [ACTION: {"type": "launch_campaign", "params": {"category": "CategoryName", "barangay": "BarangayName"}}]
Valid categories: ${BUSINESS_CATEGORIES.map((category) => `"${category}"`).join(', ')}
Valid barangays: "Lahug", "Mabolo", "Banilad", "Kamputhaw", "Kasambagan", "Guadalupe"
2. List leads: If the user wants to see actual leads, output this action block: [ACTION: {"type": "list_leads", "params": {"category": "OptionalCategory", "barangay": "OptionalBarangay", "limit": 5}}]

Answer questions directly and conversationally. If you output an action block, mention what action you are triggering. Keep responses concise and focused (under 4 sentences).`

      const client = getAnthropicClient()
      const apiMessages = messages.map((m: any) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }))

      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: apiMessages,
        temperature: 0.7,
      })

      const replyText = response.content[0].type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ success: true, message: replyText })
    } else {
      // Local Fallback Mode (Keyword/Intent Matching + Simulated response)
      const cleanedQuery = cleanText(lastUserMessage)
      let reply = ''
      let actionTag = ''

      // INTENT 1: Start Discovery Campaign
      if (
        cleanedQuery.includes('search') ||
        cleanedQuery.includes('launch') ||
        cleanedQuery.includes('campaign') ||
        cleanedQuery.includes('discover') ||
        cleanedQuery.includes('find')
      ) {
        // Extract Barangay, City and Category
        let matchedCity = 'Cebu City'
        let matchedBarangay = ''
        const matchedCategory = matchBusinessCategory(cleanedQuery) || 'Dental Clinic'

        // City matching
        if (cleanedQuery.includes('naga')) matchedCity = 'Naga City'
        else if (cleanedQuery.includes('merida')) matchedCity = 'Merida'
        else if (cleanedQuery.includes('ormoc')) matchedCity = 'Ormoc City'

        // Barangay matching
        if (cleanedQuery.includes('lahug')) matchedBarangay = 'Lahug'
        else if (cleanedQuery.includes('mabolo')) matchedBarangay = 'Mabolo'
        else if (cleanedQuery.includes('banilad')) matchedBarangay = 'Banilad'
        else if (cleanedQuery.includes('kamputhaw')) matchedBarangay = 'Kamputhaw'
        else if (cleanedQuery.includes('kasambagan')) matchedBarangay = 'Kasambagan'
        else if (cleanedQuery.includes('guadalupe')) matchedBarangay = 'Guadalupe'
        else if (cleanedQuery.includes('tuyan')) matchedBarangay = 'Tuyan'
        else if (cleanedQuery.includes('colon')) matchedBarangay = 'Colon'
        else if (cleanedQuery.includes('inoburan')) matchedBarangay = 'Inoburan'
        else if (cleanedQuery.includes('tina-an') || cleanedQuery.includes('tinaan')) matchedBarangay = 'Tina-an'
        else if (cleanedQuery.includes('poblacion')) matchedBarangay = 'Poblacion'
        else if (cleanedQuery.includes('calunangan')) matchedBarangay = 'Calunangan'
        else if (cleanedQuery.includes('cogon')) matchedBarangay = 'Cogon'
        else if (cleanedQuery.includes('punta')) matchedBarangay = 'Punta'
        else if (cleanedQuery.includes('valencia')) matchedBarangay = 'Valencia'

        const locationText = matchedBarangay ? `Barangay ${matchedBarangay} in ${matchedCity}` : matchedCity
        reply = `I will launch a Cebu discovery campaign for **${matchedCategory}s** in **${locationText}**. The engine will search OpenStreetMap Overpass and run public site crawls to find qualified business leads.`
        actionTag = ` [ACTION: {"type": "launch_campaign", "params": {"category": "${matchedCategory}", "barangay": "${matchedBarangay}", "city": "${matchedCity}"}}]`
      }
      // INTENT 2: List leads
      else if (
        cleanedQuery.includes('list') ||
        cleanedQuery.includes('show') ||
        cleanedQuery.includes('recent') ||
        cleanedQuery.includes('crm') ||
        cleanedQuery.includes('database')
      ) {
        let matchedCity = 'Cebu City'
        let matchedBarangay = undefined
        const matchedCategory = matchBusinessCategory(cleanedQuery)

        if (cleanedQuery.includes('naga')) matchedCity = 'Naga City'
        else if (cleanedQuery.includes('merida')) matchedCity = 'Merida'
        else if (cleanedQuery.includes('ormoc')) matchedCity = 'Ormoc City'

        if (cleanedQuery.includes('lahug')) matchedBarangay = 'Lahug'
        else if (cleanedQuery.includes('mabolo')) matchedBarangay = 'Mabolo'
        else if (cleanedQuery.includes('banilad')) matchedBarangay = 'Banilad'

        // Fetch DB leads matching filters
        const where: any = {}
        where.city = matchedCity
        if (matchedBarangay) where.barangay = matchedBarangay
        if (matchedCategory) where.businessCategory = matchedCategory

        const dbLeads = await prisma.business.findMany({
          where,
          take: 3,
          orderBy: { dateDiscovered: 'desc' },
          select: { name: true, barangay: true, businessCategory: true, city: true }
        })

        const leadNames = dbLeads.map(l => `• ${l.name} (${l.businessCategory} in ${l.barangay}, ${l.city})`).join('\n')
        
        reply = `Here are the most recent leads matching your request:\n\n${leadNames || 'No matching leads found.'}\n\nI have displayed the detailed records in the cards below.`
        actionTag = ` [ACTION: {"type": "list_leads", "params": {${matchedCategory ? `"category": "${matchedCategory}",` : ''} ${matchedBarangay ? `"barangay": "${matchedBarangay}",` : ''} "city": "${matchedCity}", "limit": 5}}]`
      }
      // INTENT 3: Lead counts and stats
      else if (
        cleanedQuery.includes('count') ||
        cleanedQuery.includes('how many') ||
        cleanedQuery.includes('total') ||
        cleanedQuery.includes('stats') ||
        cleanedQuery.includes('statistics')
      ) {
        if (cleanedQuery.includes('lahug')) {
          const count = await prisma.business.count({ where: { barangay: 'Lahug' } })
          reply = `We have discovered **${count} leads** in **Barangay Lahug** (IT Park Area).`
        } else if (cleanedQuery.includes('mabolo')) {
          const count = await prisma.business.count({ where: { barangay: 'Mabolo' } })
          reply = `We have discovered **${count} leads** in **Barangay Mabolo**.`
        } else if (matchBusinessCategory(cleanedQuery)) {
          const matchedCategory = matchBusinessCategory(cleanedQuery)!
          const count = await prisma.business.count({ where: { businessCategory: matchedCategory } })
          reply = `We have discovered **${count} ${matchedCategory} leads** in Cebu City.`
        } else {
          reply = `We currently have **${totalLeads} total leads** in the database.\n\nHere is the current breakdown:\n- **Barangays**: ${barangaySummary || 'None'}\n- **Categories**: ${categorySummary || 'None'}\n- **Outreach Status**: ${outreachSummary || 'None'}`
        }
      }
      // INTENT 4: Help / Default response
      else {
        reply = `Hello! I am your Cebu Digital Finder assistant. I can help you search the database, check leads distribution, and launch discovery campaigns.\n\nHere are some things you can ask me:\n- *"How many leads do we have?"*\n- *"List recent leads"* \n- *"Search for restaurants in Lahug"*`
      }

      return NextResponse.json({ success: true, message: reply + actionTag })
    }
  } catch (error: any) {
    console.error('Error in chat API:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
