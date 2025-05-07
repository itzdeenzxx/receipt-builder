# Vue Digital Receipt Generator

A modern, responsive application for creating beautiful and professional digital receipts. Built with Vue 3, Pinia, and Tailwind CSS.


### Demo https://digital-receipt-two.vercel.app



## Features

### Core Features
- **Easy Receipt Creation**: Create professional receipts with your business name, logo, and details
- **Customer Information**: Add customer details including name, address, phone, and email
- **Product Management**: Add unlimited products/services with descriptions, quantities, and prices
- **Product Images**: Upload images for each product to make your receipts more visual
- **Real-time Calculation**: Automatic calculation of subtotal, tax (VAT), discounts, and grand total
- **Receipt History**: Save and manage receipts for future reference
- **Custom Footer & Notes**: Add your own footer text, thank you messages, and additional notes
- **Input Validation**: Proper validation for emails, phone numbers, and required fields with helpful error messages

### Export & Sharing
- **PDF Export**: Download receipts as professional PDF documents
- **PNG Export**: Export receipts as high-quality PNG images
- **Direct Printing**: Print receipts directly from the browser with proper formatting
- **QR Code Generation**: Create QR codes that link to a web version of your receipt
- **Password Protection**: Add password protection to QR-shared receipts for confidentiality
- **Barcode Generation**: Generate barcodes with multiple format options (CODE128, EAN13, etc.)
- **Social Sharing**: Share receipts via WhatsApp, Line, Email, or copy link

### Data Management
- **CSV Import**: Import product lists from CSV files
- **Auto-save**: Automatically saves your work to localStorage
- **Receipt Templates**: Choose from different receipt templates (Minimal, Modern, Thai style)
- **Success Notifications**: Get feedback when operations like saving or exporting complete

### User Experience
- **Multi-language Support**: Full support for English and Thai languages
- **Currency Selection**: Choose from multiple currencies (USD, EUR, GBP, THB, JPY, etc.)
- **Dark Mode**: Toggle between light and dark interfaces
- **Mobile-friendly**: Responsive design works on all devices
- **Developer Mode**: Special dev mode for debugging and development
- **Consistent Exports**: Exports always use light theme for consistent results regardless of user theme preference

## Technology Stack

- **Vue 3**: With Composition API for reactive UI components
- **Pinia**: State management for Vue applications
- **Vue Router**: For navigation and routing
- **Vue i18n**: Internationalization for multi-language support
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Headless UI**: Accessible UI components for Vue
- **Hero Icons**: Beautiful SVG icons for the UI
- **html2pdf.js**: For PDF generation
- **html2canvas**: For PNG image export
- **QRCode.vue**: For generating QR codes
- **JsBarcode**: For generating various barcode formats
- **LocalStorage API**: For client-side data persistence

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd vue-digital-receipt

# Install dependencies
npm install
# or
yarn install
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
```

### Build for Production

```bash
# Build for production
npm run build
# or
yarn build
```

### Preview Production Build

```bash
# Preview the production build
npm run preview
# or
yarn preview
```

## Project Structure

```
/src
  /assets         - Static assets and images
  /components     - Reusable Vue components
    /layout       - Layout components like header and footer
    /ui           - UI components like modals, buttons, etc.
    /receipt      - Receipt-specific components
  /i18n           - Internationalization files
    /locales      - Language translation JSON files
  /router         - Vue Router configuration
  /stores         - Pinia state stores
  /views          - Page-level Vue components
  App.vue         - Root Vue component
  main.js         - Application entry point
  style.css       - Global CSS styles
```

## Features in Detail

### Receipt Templates

Choose from three beautiful receipt templates:

- **Minimal**: Clean, simple design focusing on essential information
- **Modern**: Contemporary design with colored header and modern typography
- **Thai**: Thai-style receipt with signature fields and Thai language support

### QR Code Sharing

Generate QR codes that link to a web version of your receipt. Recipients can view the receipt online without needing an app.

- Optional password protection for confidential receipts
- Share links via various platforms
- Receipts are saved in the browser for persistent access

### Export Options

Multiple ways to share and distribute your receipts:

- **PDF Export**: High-quality PDF documents suitable for email or storage
- **PNG Export**: Image format exports for quick sharing or social media
- **Direct Printing**: Print physical copies with proper formatting
- **Social Sharing**: Quick share to WhatsApp, LINE, or email

### CSV Import

Import product lists from CSV files to quickly populate receipts. Required columns:
- `name`: Product name
- `price`: Product price
- `quantity`: Quantity
Optional columns include `description` and more.

### Form Validation 

The app includes thorough validation for:
- Required fields validation
- Email format verification
- Phone number format validation
- Numeric field validation
- Barcode format validation

### Developer Mode

Enable developer mode by appending `?dev=true` to the URL. Developer mode provides:
- JSON view of current receipt data
- Raw view of calculations
- Copy to clipboard functionality
- Real-time updates as you edit

## License

This project is licensed under the MIT License - see the LICENSE file for details.
