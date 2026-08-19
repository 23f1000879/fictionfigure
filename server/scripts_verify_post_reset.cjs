const http = require('http');

const API_BASE = 'http://localhost:5000';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({ statusCode: res.statusCode, json, data });
      });
    });

    req.on('error', (err) => resolve({ statusCode: 500, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verifyPostReset() {
  console.log("=================================================");
  console.log("POST-RESET PRODUCTION API VERIFICATION");
  console.log("=================================================");

  // 1. GET /api/health
  const healthRes = await makeRequest('/api/health');
  console.log(`GET /api/health -> Status: ${healthRes.statusCode} | JSON:`, healthRes.json);
  if (healthRes.statusCode !== 200) throw new Error("Health check failed!");

  // 2. GET /api/version
  const versionRes = await makeRequest('/api/version');
  console.log(`GET /api/version -> Status: ${versionRes.statusCode} | JSON:`, versionRes.json);
  if (versionRes.statusCode !== 200) throw new Error("Version check failed!");

  // 3. GET /api/settings
  const settingsRes = await makeRequest('/api/settings');
  console.log(`GET /api/settings -> Status: ${settingsRes.statusCode} | Keys:`, Object.keys(settingsRes.json.settings || {}).length);
  if (settingsRes.statusCode !== 200 || !settingsRes.json.settings.shipping_fee) {
    throw new Error("Settings API check failed!");
  }

  // 4. GET /api/products/categories
  const catRes = await makeRequest('/api/products/categories');
  console.log(`GET /api/products/categories -> Status: ${catRes.statusCode} | Categories Count: ${catRes.json.categories.length}`);
  if (catRes.statusCode !== 200 || catRes.json.categories.length !== 0) {
    throw new Error("Category reset check failed!");
  }

  // 5. GET /api/products
  const prodRes = await makeRequest('/api/products');
  console.log(`GET /api/products -> Status: ${prodRes.statusCode} | Products Count: ${prodRes.json.products.length} | TotalCount: ${prodRes.json.totalCount}`);
  if (prodRes.statusCode !== 200 || prodRes.json.products.length !== 0) {
    throw new Error("Products reset check failed!");
  }

  // 6. Admin Login
  const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin@fictionfigure.demo',
    password: 'AdminPassword123!',
  });
  console.log(`POST /api/auth/login (Admin) -> Status: ${adminLoginRes.statusCode} | Success: ${adminLoginRes.json?.success}`);

  console.log("\n=================================================");
  console.log("POST-RESET VERIFICATION SUCCESSFUL! 🎉");
  console.log("=================================================");
}

verifyPostReset().catch((e) => {
  console.error(e);
  process.exit(1);
});
