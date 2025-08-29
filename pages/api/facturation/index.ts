import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { status, q, limit = '20', offset = '0' } = req.query;
    const limitNum = Math.max(1, Math.min(200, parseInt(limit as string, 10)));
    const offsetNum = Math.max(0, parseInt(offset as string, 10));

    let endpoint = '';
    
    // Déterminer l'endpoint selon le statut
    switch (status) {
      case 'payee':
        endpoint = '/api/facturation/payee';
        break;
      case 'en_attente':
        endpoint = '/api/facturation/attente';
        break;
      case 'retard':
        endpoint = '/api/facturation/retard';
        break;
      default:
        endpoint = '/api/facturation/payee'; // Par défaut
    }

    // Construire l'URL avec les paramètres
    const url = new URL(endpoint, `http://${req.headers.host}`);
    if (q) url.searchParams.set('q', q as string);
    url.searchParams.set('limit', limitNum.toString());
    url.searchParams.set('offset', offsetNum.toString());

    // Appeler l'endpoint approprié
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Erreur lors de l'appel à ${endpoint}`);
    }

    const data = await response.json();
    
    // Calculer la pagination pour le lazy loading
    const hasMore = data.invoices && data.invoices.length === limitNum;
    const nextOffset = hasMore ? offsetNum + limitNum : null;

    return res.status(200).json({
      invoices: data.invoices || [],
      pagination: {
        hasMore,
        nextOffset,
        limit: limitNum,
        offset: offsetNum,
      }
    });

  } catch (error: any) {
    console.error('facturation/index error:', error?.message || error);
    return res.status(500).json({ 
      error: 'Internal error', 
      details: error?.message || String(error) 
    });
  }
}
