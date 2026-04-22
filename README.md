# NameIntel API 🎯

A modern RESTful API service that enriches person names with demographic intelligence. By integrating with free, public APIs, this service extracts and structures gender, age, and nationality information into a clean, queryable database.

**Stage 2**: Advanced filtering, sorting, pagination, and natural language search capabilities.

---

## 🌟 Features

- **Multi-API Integration**: Seamlessly combines data from three trusted external sources
  - Genderize.io → Gender prediction & confidence
  - Agify.io → Estimated age  
  - Nationalize.io → Likely nationality/country

- **Intelligent Data Processing**: Automatically classifies and structures raw API responses
  - Age groups: Child (0-12), Teenager (13-19), Adult (20-59), Senior (60+)
  - Probability scoring for all predictions
  - Country selection based on highest probability

- **Advanced Filtering**: Filter by gender, age group, country, age ranges, and confidence scores
- **Sorting**: Sort by age, creation date, or gender probability in ascending/descending order
- **Pagination**: Efficient pagination with configurable page size (max 50)
- **Natural Language Search**: Query your data in plain English without complex syntax
- **Idempotent Operations**: Submit the same name twice, get the same result—no duplicates
- **RESTful Design**: Standard HTTP methods with consistent JSON response structure
- **Database Persistence**: MongoDB storage with UUID v7 identifiers
- **Production Ready**: Error handling, input validation, CORS support

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **HTTP Client**: Axios
- **Environment**: dotenv for configuration
- **Monitoring**: Morgan HTTP logger
- **Development**: Nodemon for hot-reload
- **ID Generation**: UUIDv7

---

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB instance (local or cloud)
- npm or yarn

### Setup

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd "NameIntel API"
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/nameintel
   NODE_ENV=development
   ```

3. **Seed the Database** (Important!)
   ```bash
   npm run seed
   ```
   
   This populates your database with 2026 demographic profiles. Safe to re-run—duplicates won't be created.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Server runs on `http://localhost:3000`

---

## 🚀 API Endpoints

### 1. Create Profile
**POST** `/api/profiles`

Create a new profile by submitting a name. The API automatically enriches it with demographic data.

**Request:**
```json
{
  "name": "Emma"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "emma",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 5234,
    "age": 32,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85,
    "country_name": "United States",
    "created_at": "2026-04-17T12:00:00Z"
  }
}
```

**Error Cases:**
- `400`: Missing or empty name
- `422`: Invalid data type
- `502`: External API returned invalid/null data

---

### 2. Get Single Profile
**GET** `/api/profiles/{id}`

Retrieve a specific profile by UUID.

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "emma",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 5234,
    "age": 32,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85,
    "country_name": "United States",
    "created_at": "2026-04-17T12:00:00Z"
  }
}
```

**Error Cases:**
- `404`: Profile not found

---

### 3. Get All Profiles (with Filtering, Sorting, Pagination) ⭐
**GET** `/api/profiles`

Retrieve profiles with advanced filtering, sorting, and pagination in a single request.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `gender` | string | Filter by gender | `male` or `female` |
| `age_group` | string | Filter by age group | `child`, `teenager`, `adult`, `senior` |
| `country_id` | string | Filter by country ISO code | `NG`, `US`, `KE`, `GB` |
| `min_age` | integer | Minimum age (inclusive) | `25` |
| `max_age` | integer | Maximum age (inclusive) | `50` |
| `min_gender_probability` | float | Minimum gender confidence (0-1) | `0.8` |
| `min_country_probability` | float | Minimum country confidence (0-1) | `0.6` |
| `sort_by` | string | Sort field | `age`, `created_at`, `gender_probability` |
| `order` | string | Sort direction | `asc` or `desc` |
| `page` | integer | Page number (default: 1) | `1` |
| `limit` | integer | Results per page (default: 10, max: 50) | `20` |

**All filters are combinable and must all match (AND logic).**

**Examples:**

```
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10

GET /api/profiles?age_group=senior&min_gender_probability=0.9

GET /api/profiles?country_id=US&max_age=30&page=2&limit=25
```

**Success Response (200):**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 145,
  "data": [
    {
      "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
      "name": "emmanuel",
      "gender": "male",
      "gender_probability": 0.99,
      "age": 34,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.85,
      "sample_size": 1200,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

**Error Cases:**
- `400`: Missing required parameters
- `422`: Invalid parameter types or invalid sort_by/order values
- `500`: Server error

---

### 4. Natural Language Search ⭐⭐
**GET** `/api/profiles/search?q=<query>`

Query profiles using plain English. The system intelligently interprets your request and converts it to filters.

**Examples:**

```
GET /api/profiles/search?q=young+males+from+nigeria
GET /api/profiles/search?q=females+above+30
GET /api/profiles/search?q=adult+males+from+kenya
GET /api/profiles/search?q=people+from+canada&page=1&limit=20
```

**Success Response (200):**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 87,
  "data": [
    {
      "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
      "name": "david",
      "gender": "male",
      "gender_probability": 0.96,
      "age": 19,
      "age_group": "teenager",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.78,
      "sample_size": 1100,
      "created_at": "2026-04-03T15:45:00Z"
    }
  ]
}
```

**Unable to Interpret Query (200):**
```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

**Pagination applies here too** — use `page` and `limit` parameters.

---

#### **Natural Language Parsing Approach**

This feature uses **rule-based parsing** (no AI/LLMs) to convert plain English queries into structured filters.

**Gender Detection:**
- **Male**: "male", "man", "men", "boy", "boys"
- **Female**: "female", "woman", "women", "girl", "girls"

**Age Group Detection:**
- **Child**: "child", "children", "kid", "kids"
- **Teenager**: "teenager", "teens"
- **Adult**: "adult", "adults"
- **Senior**: "senior", "seniors", "elderly", "old"

**Age Range Detection:**
- **"above X", "over X", "older than X"** → `min_age=X`
- **"below X", "under X", "younger than X"** → `max_age=X`

**"Young" Keyword:**
Maps to ages 16–24 if no other age group is specified.

**Country Detection:**
Recognizes 40+ country names and ISO codes. Both "from [country]" pattern and direct mentions work.

Supported: Nigeria (NG), Kenya (KE), Uganda (UG), Ghana (GH), South Africa (ZA), Tanzania (TZ), Ethiopia (ET), Cameroon (CM), Benin (BJ), Angola (AO), Sudan (SD), USA (US), Canada (CA), UK (GB), France (FR), Germany (DE), Spain (ES), Italy (IT), India (IN), Japan (JP), China (CN), Brazil (BR), Mexico (MX), Australia (AU), and more.

---

#### **Limitations & Edge Cases**

The natural language parser is intentionally simple. Here's what it **does NOT handle**:

1. **No OR Logic**: Cannot query "males OR females". Only AND combinations.
   - Workaround: Use `/api/profiles?gender=male` or `/api/profiles?gender=female`

2. **No Age Ranges**: Cannot parse "between 25 and 35". Only single-bound expressions.
   - Supported: "above 25", "under 35"
   - Workaround: `/api/profiles?min_age=25&max_age=35`

3. **No Probability Filters**: Cannot parse "high gender confidence".
   - Workaround: `/api/profiles?min_gender_probability=0.8`

4. **Limited Country Recognition**: Only 40+ common countries.
   - Workaround: Use `/api/profiles?country_id=XX` with ISO code

5. **No Sorting in Natural Language**: Results always sort by creation date (newest first).
   - Workaround: `/api/profiles?sort_by=age&order=desc`

6. **Empty or Uninterpretable Queries**: Cannot extract any filters.
   - Returns: `{"status": "error", "message": "Unable to interpret query"}`

---

### 5. Delete Profile
**DELETE** `/api/profiles/{id}`

Remove a profile from the database.

**Success Response (204):**
No content returned.

**Error Cases:**
- `404`: Profile not found

---

## 💡 Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Create a profile
async function createProfile(name) {
  const response = await axios.post(`${API_URL}/profiles`, { name });
  console.log(response.data);
}

// Advanced filtering - get adult males from Nigeria
async function getFilteredProfiles() {
  const response = await axios.get(`${API_URL}/profiles`, {
    params: {
      gender: 'male',
      age_group: 'adult',
      country_id: 'NG',
      sort_by: 'age',
      order: 'desc',
      page: 1,
      limit: 20
    }
  });
  console.log(response.data);
}

// Natural language search
async function searchNaturally() {
  const response = await axios.get(`${API_URL}/profiles/search`, {
    params: {
      q: 'young females from canada'
    }
  });
  console.log(response.data);
}

createProfile('John').catch(console.error);
getFilteredProfiles().catch(console.error);
searchNaturally().catch(console.error);
```

### cURL
```bash
# Create profile
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice"}'

# Get all profiles
curl http://localhost:3000/api/profiles

# Advanced filters - adult males from Nigeria
curl "http://localhost:3000/api/profiles?gender=male&age_group=adult&country_id=NG&sort_by=age&order=desc&limit=20"

# Natural language search
curl "http://localhost:3000/api/profiles/search?q=young+females+from+canada"

# Get single profile
curl http://localhost:3000/api/profiles/b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12

# Delete profile
curl -X DELETE http://localhost:3000/api/profiles/b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12
```

---

## 📂 Project Structure

```
NameIntel API/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   └── profile.controller.js # Business logic (create, read, filter, search)
│   ├── models/
│   │   └── profile.model.js      # Schema definition
│   ├── routes/
│   │   └── profile.routes.js     # Route handlers
│   ├── services/
│   │   ├── gender.service.js     # Genderize.io wrapper
│   │   ├── age.service.js        # Agify.io wrapper
│   │   └── nationality.service.js# Nationalize.io wrapper
│   └── utils/
│       ├── classifyAge.js        # Age group logic
│       ├── genderFormat.js       # Format gender data
│       ├── generateUUID.js       # UUID v7 generation
│       ├── selectCountry.js      # Country selection
│       ├── queryParser.js        # Natural language query parser
│       └── seedProfiles.js       # Database seeding utility
├── app.js                        # Express setup
├── server.js                     # Entry point
├── seed.js                       # Seed script runner
├── package.json
├── seed_profiles.json           # 2026 demographic profiles
└── README.md
```

---

## 🧪 Testing Endpoints

Here are some quick test queries you can try:

```bash
# Get 10 profiles sorted by age (descending)
curl "http://localhost:3000/api/profiles?limit=10&sort_by=age&order=desc"

# Get adults from Nigeria with high gender confidence
curl "http://localhost:3000/api/profiles?age_group=adult&country_id=NG&min_gender_probability=0.8"

# Natural language: Find young females from USA
curl "http://localhost:3000/api/profiles/search?q=young+females+from+usa"

# Natural language: Find senior males
curl "http://localhost:3000/api/profiles/search?q=senior+males"

# Complex filter: Adults aged 30-50 from UK with high confidence
curl "http://localhost:3000/api/profiles?age_group=adult&min_age=30&max_age=50&country_id=GB&min_gender_probability=0.85"
```

---

## 🔒 CORS & Security

The API includes CORS headers allowing requests from any origin:

```
Access-Control-Allow-Origin: *
```

All timestamps are returned in UTC ISO 8601 format. All IDs use UUID v7.

---

## 📊 Dataset

The database is seeded with **2,026 real demographic profiles** covering:
- 40+ countries including Nigeria, Kenya, USA, UK, Canada, and more
- All gender types (male, female)
- All age groups (child, teenager, adult, senior)
- Confidence/probability scores for each prediction

Run `npm run seed` to populate your database. Safe to re-run—duplicates won't be created.

---

## 🎯 Performance Notes

- Indexed queries on common filters (gender, age_group, country_id)
- Pagination prevents full-table scans on large result sets
- MongoDB aggregation for efficient counting during pagination
- Natural language parser runs in <10ms per request

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/nameintel
```

---

## 📝 License

ISC

---

## 🤝 Contributing

Pull requests welcome! Follow existing code style and include tests for new features.

---

**Last Updated**: April 2026  
**Version**: 2.0.0 (Stage 2)
