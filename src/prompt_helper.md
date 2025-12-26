Design philosophy: Responsive and viewable on mobile as well as desktop

Tech stack:
a. Angular version21, Angular Material, cssflexbox for styling
c. .Net Core Web API
d. MongoDb

Do not use these features:
a. deprecated/obsolete features
b. ngif, ngFor, ngForof, ngModule, FormsModule

Use these features wherever applicable:
a. signal
b. subscribe(next,error)
c. ReactiveFormsModule
d. @if(){}, @for

Keywords and their meaning mentioned below:
FreeText - it means textbox with max 100 characters
FreeTextLong - it means textbox with max 250 characters
DateTime - format 'dd-MM-yyyy hh:mm:ss' in 24hr format UTC
DateOnly - format 'dd-MM-yyyy', display local
TimeOnly - format 'hh-mm-ss' in 24hr format UTC, display local

NOTE - all datetimes selected/shown/displayed in UI will be in Local datetime, but should be sent as UTC to backend