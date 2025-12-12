    // my-date-formats.ts
    import { MatDateFormats } from '@angular/material/core';

    export const DDMMYYYY_DATE_FORMATS: MatDateFormats = {
      parse: {
        dateInput: 'DDD', // Format for parsing user input
      },
      display: {
        dateInput: 'DD', // Format for displaying in the input field
        monthYearLabel: 'MMM yyyy', // Format for the month/year label in the calendar header
        dateA11yLabel: 'LL', // Format for accessibility label of individual dates
        monthYearA11yLabel: 'MMMM yyyy', // Format for accessibility label of the month/year label
      },

      // parse: {
      //   dateInput: 'DDD',
      // },
      // display: {
      //   dateInput: 'DDD',
      //   monthYearLabel: 'MMM yyyy',
      //   dateA11yLabel: 'DDD',
      //   monthYearA11yLabel: 'MMMM yyyy',
      // },
    };