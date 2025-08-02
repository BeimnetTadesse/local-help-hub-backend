const express = require('express');
const app = express();
app.use(express.json());
app.post('/test', (req, res) => {
  console.log('POST /test', req.body);
  res.json({ success: true });
});
app.listen(5000, () => console.log('Listening on 5000'));
