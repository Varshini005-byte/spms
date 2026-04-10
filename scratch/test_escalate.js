fetch('https://spms-ie7g.onrender.com/permissions/1/escalate', { method: 'PUT' })
  .then(res => res.text())
  .then(text => console.log('Response:', text))
  .catch(err => console.error('Fetch error:', err));
