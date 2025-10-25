import { Request, Response, NextFunction } from 'express';

export interface GYGQueryParams {
  product_id: string;
  from: string;
  to: string;
  currency?: string;
  unavailable_from?: string;
  unavailable_to?: string;
}

export function validateGYGQuery(req: Request, res: Response, next: NextFunction) {
  const { product_id, from, to, currency, unavailable_from, unavailable_to } = req.query as Record<string, string>;

  // Required fields validation
  if (!product_id) {
    return res.status(400).json({ 
      error: 'Missing required parameter: product_id' 
    });
  }

  if (!from) {
    return res.status(400).json({ 
      error: 'Missing required parameter: from' 
    });
  }

  if (!to) {
    return res.status(400).json({ 
      error: 'Missing required parameter: to' 
    });
  }

  // Validate ISO 8601 UTC timestamps for required fields
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  
  if (!iso8601Regex.test(from)) {
    return res.status(400).json({ 
      error: 'Invalid from parameter: must be ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ssZ)' 
    });
  }

  if (!iso8601Regex.test(to)) {
    return res.status(400).json({ 
      error: 'Invalid to parameter: must be ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ssZ)' 
    });
  }

  // Unavailable range validation - both must be present or both absent
  const hasUnavailableFrom = !!unavailable_from;
  const hasUnavailableTo = !!unavailable_to;

  if (hasUnavailableFrom && !hasUnavailableTo) {
    return res.status(400).json({ 
      error: 'unavailable_from and unavailable_to must be provided together' 
    });
  }

  if (!hasUnavailableFrom && hasUnavailableTo) {
    return res.status(400).json({ 
      error: 'unavailable_from and unavailable_to must be provided together' 
    });
  }

  // If both unavailable fields are present, validate their format
  if (hasUnavailableFrom && hasUnavailableTo) {
    if (!iso8601Regex.test(unavailable_from)) {
      return res.status(400).json({ 
        error: 'Invalid unavailable_from parameter: must be ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ssZ)' 
      });
    }

    if (!iso8601Regex.test(unavailable_to)) {
      return res.status(400).json({ 
        error: 'Invalid unavailable_to parameter: must be ISO 8601 UTC format (YYYY-MM-DDTHH:mm:ssZ)' 
      });
    }
  }

  // Store validated params for use in handlers
  req.gygParams = {
    product_id,
    from,
    to,
    currency: currency || 'MAD',
    unavailable_from,
    unavailable_to
  };

  next();
}

// Extend Request interface to include gygParams
declare global {
  namespace Express {
    interface Request {
      gygParams?: GYGQueryParams;
    }
  }
}
