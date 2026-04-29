const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users',        require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/materials',    require('./routes/materials'));
app.use('/api/locations',    require('./routes/locations'));
app.use('/api/rewards',      require('./routes/rewards'));
app.use('/api/admin',        require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'EcoCycle API is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
