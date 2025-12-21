# Gemini API Quota Management Guide

## Understanding the Error

The error you're seeing indicates that the Gemini API quota has been exceeded:

```
Quota exceeded for quota metric 'Generate Content API requests per minute'
```

This means you've hit the free tier limit for API requests.

## Solutions

### 1. **Rate Limiting (Already Implemented)**

The backend now includes automatic rate limiting:
- Maximum 15 API calls per minute (conservative limit)
- Automatic fallback to heuristic analysis when quota is exceeded
- Better error messages with retry suggestions

### 2. **Get a New API Key**

If you need more quota:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Update `backend/.env.local`:
   ```
   GEMINI_API_KEY=your_new_api_key_here
   ```

### 3. **Upgrade Your Quota**

For production use, consider upgrading:
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to "APIs & Services" → "Quotas"
- Request a quota increase for Gemini API

### 4. **Use Fallback Mode**

The system now automatically falls back to heuristic analysis when AI is unavailable:
- Basic traffic analysis based on queue lengths
- Simple signal timing adjustments
- No AI required for basic functionality

## Current Rate Limits

### Free Tier (Default)
- **Requests per minute**: 15 (per region)
- **Requests per day**: 1,500
- **Tokens per minute**: 1 million

### Paid Tier
- **Requests per minute**: 1,000+
- **Requests per day**: Unlimited
- **Tokens per minute**: 4 million+

## Best Practices

### 1. **Reduce API Calls**
- Cache AI responses when possible
- Use fallback mode for non-critical features
- Batch multiple requests together

### 2. **Optimize Prompts**
- Keep prompts concise
- Use structured outputs (JSON schema)
- Avoid unnecessary context

### 3. **Monitor Usage**
- Check the backend console for rate limit warnings
- Track API call patterns
- Implement usage analytics

### 4. **Development vs Production**
- Use different API keys for dev and prod
- Implement stricter rate limits in development
- Consider mock responses for testing

## Testing Without AI

You can test the application without making AI calls:

1. The system will automatically use fallback mode
2. Basic traffic analysis still works
3. All UI features remain functional

## Error Handling

The backend now handles quota errors gracefully:

```javascript
// 429 status code for rate limit exceeded
{
  "error": "API quota exceeded. Please try again later or use a different API key.",
  "details": "The Gemini API quota has been exceeded...",
  "retryAfter": 3600  // Seconds until retry
}
```

## Monitoring API Usage

Check the backend console for:
- `API rate limit reached, rejecting request` - Local rate limit hit
- `Using fallback analysis` - Fallback mode activated
- `Gemini API call failed` - API error occurred

## Alternative Solutions

### 1. **Use Multiple API Keys**
Rotate between multiple free-tier API keys

### 2. **Implement Caching**
Cache AI responses for common scenarios

### 3. **Reduce Features**
Disable non-essential AI features temporarily

### 4. **Wait and Retry**
Quotas reset every minute/hour/day depending on the limit

## Current Implementation

The backend now includes:
- ✅ Rate limiting (15 calls/minute)
- ✅ Automatic fallback to heuristics
- ✅ Better error messages
- ✅ Retry-after headers
- ✅ Development mode error details

## Need Help?

If you continue to experience issues:
1. Check your API key is valid
2. Verify you're not hitting other quota limits
3. Consider upgrading to a paid tier
4. Use the fallback mode for testing

## Resources

- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Quota Management](https://cloud.google.com/docs/quotas)
- [API Key Management](https://aistudio.google.com/app/apikey)

 '
 