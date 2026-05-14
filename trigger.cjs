const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/trigger-data-update',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("RESPONSE:", data);
  });
});

req.on('error', (error) => {
  console.error("ERROR:", error);
});

req.write(JSON.stringify({ batchSize: 1 }));
req.end();
