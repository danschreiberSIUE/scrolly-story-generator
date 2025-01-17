import { StepData } from "./common.js";
import { ScrollyError } from "./common.js";

// The Google Sheet below is a template. You can copy it to your Google Drive and use it to create your own scroll story.
// Use the URL from the browser address bar replacing the one below.
// Note that you must publish this sheet to the web for it to be accessible by the Google Sheets API.
// Google Sheet File menu -> Share-> Publish to Web -> Publish Entire Document as Web Page
// Also, you must Share the sheet so that anyone with a link can access it
// Share button at top right of sheet -> General Access -> Anyone with the link -> Viewer
var googleSheetURL =
  "https://docs.google.com/spreadsheets/d/1Nkq7DLecFxgwSs9tC0f_k0tTNTHPrsV3Bqf9L98aSuQ/edit?gid=0#gid=0";

//googleSheetURL =
//  "docs.google.com/spreadsheets/d/1qg8Ap_YeYf-vpS5QPNAFX8KJ3IEo_r_TAigIcWwHxmU/edit?gid=1843475809#gid=1843475809";

// An API Key is required to read a google sheet from an application. It is generated at https://console.developers.google.com
// and if you plan to publish this scrolly story on your own standalone site, you will need to generate your own key.
// To generate your own key:
// 1. Go to https://console.developers.google.com
// 2. Create a new project with unique name (don't need a Parent Organization)
// 3. Enable APIs and Services
// 4. Search for Google Sheets API, click on it and then enable it
// 5. Choose Credentials from the left menu
// 6. Click on Create Credentials
// 7. Restrict the key under API restrictions and restrict to Google Sheets API
// 7. Copy the key and replace the one below
var googleApiKey = "AIzaSyA_HsSEP3PPc7CNU6xg3qxZYqJYKvX21cw";

const spreadsheetId = extractSpreadsheetIDFromURL(googleSheetURL);
function extractSpreadsheetIDFromURL(url) {
  try {
    return url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
  } catch (error) {
    return "InvalidGoogleSheetURL";
  }
}

const apiEndpoint = createGoogleSheetsAPIEndpoint(spreadsheetId, googleApiKey);
function createGoogleSheetsAPIEndpoint() {
  //return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Steps?key=${googleApiKey}`;
}

// Function to fetch data from Google Sheets
export async function fetchAllDataFromGoogleSheet() {
  try {
    const response = await fetch(apiEndpoint);
    const responseJson = await response.json();
    if (!response.ok) {
      throw createErrorFromGoogleSheetResponse(responseJson.error);
    }

    return convertGoogleSheetDataToStepDataArray(responseJson.values);
  } catch (error) {
    //TODO: check if other errors have use the error.message pattern
    // if so, don't need to check instanceof ScrollyError
    if (!(error instanceof ScrollyError)) {
      error = new ScrollyError(
        "Fetching data from Google Sheet " + googleSheetURL,
        error.toString()
      );
    }
    throw error;
  }
}
function createErrorFromGoogleSheetResponse(responseError) {
  throw new ScrollyError(
    "Fetching data from Google Sheet " + googleSheetURL,
    responseError.Message
  );
}

function convertGoogleSheetDataToStepDataArray(values) {
  values.shift(); // remove the header row

  const stepDataArray = values.map((row) => {
    const [contentType, FilePath, Latitude, Longitude, ZoomLevel, Text] = row;
    return new StepData(
      contentType,
      FilePath,
      Latitude,
      Longitude,
      ZoomLevel,
      Text
    );
  });
  return stepDataArray;
}
