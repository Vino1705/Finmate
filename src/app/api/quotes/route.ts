import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbolsStr = searchParams.get('symbols');

    if (!symbolsStr) {
        return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const symbols = symbolsStr.split(',').filter(s => s.trim().length > 0);
    const fetchedAt = new Date().toISOString();

    try {
        // Fetch quotes in parallel
        const quotePromises = symbols.map(async (symbol) => {
            const trimmedSymbol = symbol.trim();
            try {
                // Using Yahoo Finance v8 chart API which is generally more accessible than the quote API
                // It provides the most recent price in the metadata
                const response = await fetch(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${trimmedSymbol}?interval=1d&range=1d`,
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        },
                        next: { revalidate: 300 } // Cache for 5 minutes
                    }
                );

                if (!response.ok) {
                    return { symbol: trimmedSymbol, error: `Quote source returned ${response.status}` };
                }

                const data = await response.json();
                const meta = data.chart?.result?.[0]?.meta;

                if (!meta) {
                    return { symbol: trimmedSymbol, error: 'Asset not found or no data available' };
                }

                return {
                    symbol: trimmedSymbol.toUpperCase(),
                    price: meta.regularMarketPrice,
                    timestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
                };
            } catch (err) {
                console.error(`Error fetching quote for ${trimmedSymbol}:`, err);
                return { symbol: trimmedSymbol, error: 'Connection failed' };
            }
        });

        const quotes = await Promise.all(quotePromises);

        return NextResponse.json({
            source: 'Yahoo Finance',
            fetchedAt,
            quotes,
        });
    } catch (error) {
        console.error('Quotes API Error:', error);
        return NextResponse.json({ error: 'Failed to process quotes' }, { status: 500 });
    }
}
