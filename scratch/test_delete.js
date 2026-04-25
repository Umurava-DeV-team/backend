const http = require('http');

async function testDelete() {
  const id = '69eb5575d24c9cfdc47155ac'; 
  const url = `http://localhost:5000/api/assessments/${id}/delete`;
  
  console.log(`Testing DELETE for: ${url}`);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/assessments/${id}/delete`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  req.end();
}

testDelete();
