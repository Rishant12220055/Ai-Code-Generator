// MongoDB initialization script
db = db.getSiblingDB('component-generator');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 100
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin']
        },
        isActive: {
          bsonType: 'bool'
        }
      }
    }
  }
});

db.createCollection('sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'userId'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200
        },
        userId: {
          bsonType: 'objectId'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'archived', 'deleted']
        }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ isActive: 1 });

db.sessions.createIndex({ userId: 1, createdAt: -1 });
db.sessions.createIndex({ userId: 1, status: 1 });
db.sessions.createIndex({ 'metadata.lastActivity': -1 });
db.sessions.createIndex({ status: 1 });

print('Database initialized successfully');