# Workshop Manager - Project TODO

## Database & Schema
- [x] Customer table with contact details
- [x] Vehicle table with registration, make, model, type (2-wheeler/4-wheeler)
- [x] Job card table with status tracking, dates, totals
- [x] Service items table (labor line items per job card)
- [x] Parts table (parts used per job card)
- [x] Reminders table for service due dates

## Backend API
- [x] Customer CRUD operations
- [x] Vehicle CRUD operations (linked to customer)
- [x] Job card CRUD with status management
- [x] Service items and parts management per job card
- [x] Service history per vehicle
- [x] Dashboard analytics (pending jobs, completed jobs, revenue)
- [x] Search and filter for customers and job cards
- [x] Reminder system (create from job card details)
- [x] Invoice data endpoint with itemized breakdown

## Frontend Pages
- [x] Dashboard with pending/completed jobs and revenue summary
- [x] Customer management page with search/filter
- [x] Vehicle management linked to customers
- [x] Job card creation and management with full workflow
- [x] Job card detail view with service items and parts
- [x] Service history view per vehicle
- [x] Reminders page showing upcoming service due dates
- [x] Invoice generation with print-ready layout
- [x] Elegant global theming and professional design

## Testing
- [x] Backend unit tests for core procedures (37 tests passing)
- [x] Add Vehicle button/dialog on the Vehicles page (select customer, enter vehicle details)

## Language Customization
- [x] Create i18n context and language provider
- [x] Create translation files for English, Tamil, Hindi, Telugu, Kannada
- [x] Add language switcher in sidebar/header
- [x] Integrate translations into Dashboard page
- [x] Integrate translations into Customers page
- [x] Integrate translations into Vehicles page
- [x] Integrate translations into Job Cards page
- [x] Integrate translations into Reminders page
- [x] Integrate translations into Invoice page
- [x] Integrate translations into all dialogs and forms
- [x] Persist language preference in localStorage
