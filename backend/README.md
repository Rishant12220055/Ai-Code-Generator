# Component Generator Platform - Backend

A robust Node.js backend API for the AI-driven Component Generator Platform, built with Express.js, MongoDB, Redis, and integrated AI services.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization**: JWT-based auth with refresh tokens
- **Session Management**: Create, manage, and persist chat sessions
- **AI Integration**: Support for multiple LLM providers (OpenAI, OpenRouter)
- **Real-time Communication**: WebSocket support for live updates
- **Component Generation**: AI-powered React component creation and refinement
- **Data Persistence**: MongoDB for data storage, Redis for caching

### Security & Performance
- **Rate Limiting**: Configurable rate limits for different endpoints
- **Input Validation**: Comprehensive request validation with express-validator
- **Security Headers**: Helmet.js for security headers
- **CORS Configuration**: Flexible CORS setup for frontend integration
- **Error Handling**: Centralized error handling with detailed logging
- **Caching**: Redis-based caching for improved performance

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT with bcryptjs
- **AI Services**: OpenAI API, OpenRouter API
- **Real-time**: Socket.IO
- **Validation**: express-validator, Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services**
   ```bash
   # Start MongoDB (if running locally)
   mongod

   # Start Redis (if running locally)
   redis-server
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/component-generator` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `OPENROUTER_API_KEY` | OpenRouter API key | Optional |
| `AI_MODEL` | Default AI model | `gpt-4o-mini` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Database Schema

#### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  isActive: Boolean,
  preferences: {
    theme: String,
    defaultModel: String,
    autoSave: Boolean
  },
  usage: {
    totalSessions: Number,
    totalComponents: Number,
    totalTokens: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Sessions Collection
```javascript
{
  name: String,
  userId: ObjectId (ref: User),
  messages: [{
    id: String,
    type: String (enum: ['user', 'assistant']),
    content: String,
    timestamp: Date,
    componentCode: Object,
    metadata: Object
  }],
  currentComponent: {
    id: String,
    jsx: String,
    css: String,
    name: String,
    description: String,
    version: Number
  },
  settings: {
    model: String,
    temperature: Number,
    maxTokens: Number
  },
  status: String (enum: ['active', 'archived', 'deleted']),
  metadata: {
    totalTokens: Number,
    totalMessages: Number,
    lastActivity: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password
- `DELETE /api/v1/auth/account` - Delete account

### Sessions
- `GET /api/v1/sessions` - Get user sessions
- `POST /api/v1/sessions` - Create new session
- `GET /api/v1/sessions/:id` - Get specific session
- `PUT /api/v1/sessions/:id` - Update session
- `DELETE /api/v1/sessions/:id` - Delete session
- `PUT /api/v1/sessions/:id/archive` - Archive session
- `POST /api/v1/sessions/:id/duplicate` - Duplicate session
- `GET /api/v1/sessions/stats` - Get session statistics

### Messages
- `POST /api/v1/sessions/:id/messages` - Send message to AI
- `GET /api/v1/sessions/:id/messages` - Get session messages
- `PUT /api/v1/sessions/:id/messages/:messageId` - Edit message
- `DELETE /api/v1/sessions/:id/messages/:messageId` - Delete message
- `POST /api/v1/sessions/:id/messages/:messageId/regenerate` - Regenerate AI response

## 🤖 AI Integration

### Supported Models
- **OpenAI**: GPT-4, GPT-4o-mini, GPT-3.5-turbo
- **OpenRouter**: Claude 3 Sonnet, Llama 3, Gemini 2.0 Flash

### AI Service Features
- **Component Generation**: Create React components from natural language
- **Component Refinement**: Modify existing components based on feedback
- **Context Awareness**: Maintain conversation context for better results
- **Error Handling**: Graceful fallbacks and error recovery
- **Token Tracking**: Monitor and limit token usage

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs (12 rounds)
- Role-based access control
- Token blacklisting on logout

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- AI Generation: 10 requests per minute
- File Upload: 5 uploads per minute

### Input Validation
- Request body validation with express-validator
- File upload restrictions (type, size)
- SQL injection prevention
- XSS protection

### Security Headers
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy

## 📊 Monitoring & Logging

### Winston Logger
- Structured logging with multiple levels
- File and console transports
- Error tracking and debugging
- Request/response logging

### Health Monitoring
- Health check endpoint (`/health`)
- System metrics (uptime, memory, CPU)
- Database connection status
- Redis connection status

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   PORT=5000
   # Set all required environment variables
   ```

2. **Database Setup**
   ```bash
   # MongoDB Atlas or self-hosted MongoDB
   # Redis Cloud or self-hosted Redis
   ```

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name "component-generator-api"
   
   # Using Docker
   docker build -t component-generator-api .
   docker run -p 5000:5000 component-generator-api
   ```

### Deployment Platforms
- **Heroku**: Ready for Heroku deployment
- **AWS**: EC2, ECS, or Lambda deployment
- **DigitalOcean**: App Platform or Droplet
- **Render**: Direct deployment support
- **Vercel**: Serverless functions support

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📈 Performance Optimization

### Caching Strategy
- User data caching (1 hour TTL)
- Session data caching (1 hour TTL)
- Rate limiting data (15 minutes TTL)
- Token blacklisting (until expiry)

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization
- Aggregation pipelines for analytics

### Memory Management
- Graceful shutdown handling
- Connection cleanup
- Memory leak prevention
- Resource monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/v1/docs`
- Review the health check at `/health`

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added real-time features and improved AI integration
- **v1.2.0**: Enhanced security and performance optimizations