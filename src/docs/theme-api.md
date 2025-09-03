# Theme API

The Theme API allows authenticated users to update funnel theme configurations. Themes control the visual appearance and styling of funnels including colors, fonts, layouts, and other design elements.

## Base URL
```
/api/themes
```

## Authentication
All theme endpoints require JWT authentication via Authorization header or cookies.

## Endpoints

### 1. Update Theme
Updates the theme configuration for a specific funnel.

**Endpoint:** `PUT /api/themes/:id`

**Authentication:** Required (JWT token)

**Path Parameters:**
- `id` (number, required): ID of the theme to update

**Request Body:**
```json
{
  "colors": {
    "primary": "#007bff",
    "secondary": "#6c757d",
    "success": "#28a745",
    "danger": "#dc3545",
    "warning": "#ffc107",
    "info": "#17a2b8",
    "light": "#f8f9fa",
    "dark": "#343a40",
    "background": "#ffffff",
    "text": "#212529"
  },
  "fonts": {
    "primaryFont": "Arial, sans-serif",
    "secondaryFont": "Georgia, serif",
    "headingFont": "Helvetica, sans-serif"
  },
  "spacing": {
    "containerPadding": 20,
    "elementSpacing": 16,
    "sectionSpacing": 32
  },
  "borderRadius": {
    "small": 4,
    "medium": 8,
    "large": 12,
    "round": 50
  },
  "buttons": {
    "primaryStyle": {
      "backgroundColor": "#007bff",
      "textColor": "#ffffff",
      "borderRadius": 8,
      "padding": "12px 24px",
      "fontWeight": "600"
    },
    "secondaryStyle": {
      "backgroundColor": "transparent",
      "textColor": "#007bff",
      "borderColor": "#007bff",
      "borderRadius": 8,
      "padding": "12px 24px",
      "fontWeight": "600"
    }
  },
  "layout": {
    "containerMaxWidth": 1200,
    "gridColumns": 12,
    "breakpoints": {
      "mobile": 768,
      "tablet": 1024,
      "desktop": 1200
    }
  },
  "customCSS": ".custom-style { margin: 10px; }",
  "version": "1.0.0",
  "lastModified": "2023-12-01T10:30:00.000Z"
}
```

**Request Schema:**
- `colors` (object, optional): Color scheme configuration
  - `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark` (string): Standard color values
  - `background`, `text` (string): Background and text colors
- `fonts` (object, optional): Typography configuration
  - `primaryFont`, `secondaryFont`, `headingFont` (string): Font family definitions
- `spacing` (object, optional): Spacing and layout configuration
  - `containerPadding`, `elementSpacing`, `sectionSpacing` (number): Pixel values
- `borderRadius` (object, optional): Border radius settings
  - `small`, `medium`, `large`, `round` (number): Pixel values
- `buttons` (object, optional): Button styling configuration
  - `primaryStyle`, `secondaryStyle` (object): Style definitions for button variants
- `layout` (object, optional): Layout and responsive design settings
  - `containerMaxWidth` (number): Maximum container width in pixels
  - `gridColumns` (number): Number of grid columns
  - `breakpoints` (object): Responsive breakpoint definitions
- `customCSS` (string, optional): Custom CSS styles
- `version` (string, optional): Theme version identifier
- `lastModified` (string, optional): Last modification timestamp

**Response:**
```json
{
  "success": true,
  "message": "Theme updated successfully",
  "data": {
    "id": 123,
    "funnelId": 456,
    "colors": {
      "primary": "#007bff",
      "secondary": "#6c757d",
      "background": "#ffffff",
      "text": "#212529"
    },
    "fonts": {
      "primaryFont": "Arial, sans-serif",
      "secondaryFont": "Georgia, serif"
    },
    "spacing": {
      "containerPadding": 20,
      "elementSpacing": 16
    },
    "version": "1.0.0",
    "updatedAt": "2023-12-01T10:30:00.000Z",
    "createdAt": "2023-11-15T08:20:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Theme updated successfully
- `400`: Invalid request data or validation errors
- `401`: Unauthorized (invalid or missing JWT token)
- `403`: Forbidden (insufficient permissions to update theme)
- `404`: Theme not found
- `500`: Internal server error

## Permissions

### Workspace-Based Access Control
Access to theme updates is controlled through workspace membership and permissions:

**Workspace Owner:** Full access to update themes in all funnels within their workspace

**Workspace Members:** Access based on role and permissions:
- **OWNER/ADMIN:** Full access to update themes
- **EDITOR:** Requires `EDIT_FUNNELS` permission to update themes
- **VIEWER:** No theme update access

### Permission Validation
The API validates workspace access through:
1. Theme → Funnel → Workspace relationship verification
2. User workspace membership verification
3. Role and permission checks for non-owners

## Data Models

### Theme
```typescript
{
  id: number;
  funnelId: number;
  colors: {
    primary?: string;
    secondary?: string;
    success?: string;
    danger?: string;
    warning?: string;
    info?: string;
    light?: string;
    dark?: string;
    background?: string;
    text?: string;
    [key: string]: string;
  };
  fonts: {
    primaryFont?: string;
    secondaryFont?: string;
    headingFont?: string;
    [key: string]: string;
  };
  spacing: {
    containerPadding?: number;
    elementSpacing?: number;
    sectionSpacing?: number;
    [key: string]: number;
  };
  borderRadius: {
    small?: number;
    medium?: number;
    large?: number;
    round?: number;
    [key: string]: number;
  };
  buttons: {
    primaryStyle?: object;
    secondaryStyle?: object;
    [key: string]: object;
  };
  layout: {
    containerMaxWidth?: number;
    gridColumns?: number;
    breakpoints?: {
      mobile?: number;
      tablet?: number;
      desktop?: number;
      [key: string]: number;
    };
    [key: string]: any;
  };
  customCSS?: string;
  version?: string;
  lastModified?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Related Models
- **Funnel:** Contains theme and belongs to workspace
- **Workspace:** Controls access permissions for theme updates

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": "Invalid theme data",
  "errors": [
    {
      "field": "colors.primary",
      "message": "Primary color must be a valid hex color"
    }
  ]
}
```

### Permission Errors
- **Theme not found:** Returns 404 when theme ID doesn't exist
- **Workspace access denied:** Returns 403 when user lacks workspace access
- **Insufficient permissions:** Returns 403 when user lacks `EDIT_FUNNELS` permission

## Caching

### Cache Management
Theme updates automatically update relevant cache entries:

1. **Funnel Cache:** Updates `workspace:{workspaceId}:funnel:{funnelId}:full` cache
2. **Funnel List Cache:** Updates `workspace:{workspaceId}:funnels:all` cache

### Cache Invalidation
- Cache entries are updated with new theme data
- Failed cache updates don't prevent theme updates from completing
- Cache operations are logged for debugging

## Usage Examples

### Update Theme Colors (JavaScript)
```javascript
const response = await fetch('/api/themes/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      background: '#f7f7f7',
      text: '#2c3e50'
    },
    version: '2.0.0'
  })
});

const result = await response.json();
```

### Update Typography Settings (JavaScript)
```javascript
const response = await fetch('/api/themes/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    fonts: {
      primaryFont: 'Roboto, sans-serif',
      headingFont: 'Playfair Display, serif'
    },
    spacing: {
      containerPadding: 24,
      elementSpacing: 18
    }
  })
});
```

### Update Button Styles (JavaScript)
```javascript
const response = await fetch('/api/themes/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    buttons: {
      primaryStyle: {
        backgroundColor: '#e74c3c',
        textColor: '#ffffff',
        borderRadius: 25,
        padding: '14px 28px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }
    }
  })
});
```

## Security Considerations

### Access Control
- All theme updates require authentication
- Workspace-based permissions prevent unauthorized access
- Theme updates are limited to users with `EDIT_FUNNELS` permission

### Data Validation
- All theme data is validated using Zod schemas
- CSS injection prevention through sanitization
- Color values validated for proper format

### Audit Trail
- Theme updates are logged with user ID and timestamp
- Cache operations are logged for debugging
- Error tracking for failed permission checks