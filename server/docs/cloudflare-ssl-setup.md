# Setting Up SSL with Cloudflare for DnD Brand

This guide will walk you through setting up free SSL certificates using Cloudflare for your DnD Brand e-commerce website.

## Step 1: Create a Cloudflare Account

1. Go to [Cloudflare.com](https://www.cloudflare.com/) and click "Sign Up"
2. Enter your email address and create a password
3. Verify your email address

## Step 2: Add Your Website to Cloudflare

1. After logging in, click "Add a Site" 
2. Enter your domain name (e.g., `dndbrand.com`) and click "Add Site"
3. Select the Free plan and click "Continue"
4. Cloudflare will scan your DNS records - wait for this to complete

## Step 3: Update Your DNS Records

1. Review the DNS records Cloudflare found
2. Make sure all your important records are there (A records, CNAME records, etc.)
3. Click "Continue"
4. Cloudflare will provide you with two nameservers (e.g., `aisha.ns.cloudflare.com` and `cruz.ns.cloudflare.com`)
5. Go to your domain registrar (where you purchased your domain)
6. Replace your current nameservers with the Cloudflare nameservers
7. Save the changes

## Step 4: Configure SSL Settings

1. While waiting for DNS changes to propagate (can take up to 24 hours), configure SSL:
2. In your Cloudflare dashboard, select your website
3. Go to "SSL/TLS" in the sidebar
4. For the SSL/TLS encryption mode, select "Full" (or "Full (strict)" if you have origin certificates)
5. Under "Edge Certificates", make sure "Always Use HTTPS" is enabled
6. Enable "Automatic HTTPS Rewrites" to prevent mixed content errors

## Step 5: Verify SSL is Working

1. After DNS propagation (usually 24 hours or less), visit your website using `https://`
2. You should see a padlock icon in the browser address bar
3. You can also check your SSL configuration using [SSL Labs](https://www.ssllabs.com/ssltest/)

## Step 6: Update Your Server Configuration

Now that your site has SSL through Cloudflare, update your server configuration:

1. Open `server/production-server.js` and ensure it's configured to work with Cloudflare
2. Update your environment variables to reflect that you're using Cloudflare for SSL
3. Make sure your API endpoints accept the Cloudflare headers

## Additional Security Settings in Cloudflare

For enhanced security, consider enabling these Cloudflare features:

1. **HTTP Strict Transport Security (HSTS)**: Under SSL/TLS > Edge Certificates
2. **Security Level**: Under Security > Settings
3. **Web Application Firewall (WAF)**: Under Security > WAF
4. **Bot Fight Mode**: Under Security > Bots

## Troubleshooting

- **Certificate not showing**: Make sure DNS has fully propagated
- **Mixed content warnings**: Enable "Automatic HTTPS Rewrites" in Cloudflare
- **API calls failing**: Ensure your server accepts the Cloudflare IP ranges

## Next Steps

After setting up SSL with Cloudflare, you should:

1. Update your `public/js/config.js` to use HTTPS URLs
2. Test your payment processing to ensure it works with the new SSL setup
3. Scan your site for any remaining HTTP resources and update them to HTTPS 