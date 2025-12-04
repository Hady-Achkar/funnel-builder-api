import { createItem } from "../createItem";
import { getConfigFromEnv, isMondayConfigured } from "../getConfig";
import {
  PartnerRegistrationData,
  PartnerRegistrationDataSchema,
  CreatedItem,
} from "../types";

/**
 * Map of phone country calling codes to ISO 2-letter country codes
 * Used to help Monday.com display the correct flag
 */
const CALLING_CODE_TO_COUNTRY: Record<string, string> = {
  "1": "US", // US/Canada - default to US
  "7": "RU",
  "20": "EG",
  "27": "ZA",
  "30": "GR",
  "31": "NL",
  "32": "BE",
  "33": "FR",
  "34": "ES",
  "36": "HU",
  "39": "IT",
  "40": "RO",
  "41": "CH",
  "43": "AT",
  "44": "GB",
  "45": "DK",
  "46": "SE",
  "47": "NO",
  "48": "PL",
  "49": "DE",
  "51": "PE",
  "52": "MX",
  "53": "CU",
  "54": "AR",
  "55": "BR",
  "56": "CL",
  "57": "CO",
  "58": "VE",
  "60": "MY",
  "61": "AU",
  "62": "ID",
  "63": "PH",
  "64": "NZ",
  "65": "SG",
  "66": "TH",
  "81": "JP",
  "82": "KR",
  "84": "VN",
  "86": "CN",
  "90": "TR",
  "91": "IN",
  "92": "PK",
  "93": "AF",
  "94": "LK",
  "95": "MM",
  "98": "IR",
  "212": "MA",
  "213": "DZ",
  "216": "TN",
  "218": "LY",
  "220": "GM",
  "221": "SN",
  "234": "NG",
  "249": "SD",
  "254": "KE",
  "255": "TZ",
  "256": "UG",
  "260": "ZM",
  "263": "ZW",
  "351": "PT",
  "352": "LU",
  "353": "IE",
  "354": "IS",
  "355": "AL",
  "358": "FI",
  "359": "BG",
  "370": "LT",
  "371": "LV",
  "372": "EE",
  "380": "UA",
  "381": "RS",
  "385": "HR",
  "386": "SI",
  "420": "CZ",
  "421": "SK",
  "852": "HK",
  "853": "MO",
  "880": "BD",
  "886": "TW",
  "961": "LB",
  "962": "JO",
  "963": "SY",
  "964": "IQ",
  "965": "KW",
  "966": "SA",
  "967": "YE",
  "968": "OM",
  "970": "PS",
  "971": "AE",
  "972": "IL",
  "973": "BH",
  "974": "QA",
  "975": "BT",
  "976": "MN",
  "977": "NP",
  "992": "TJ",
  "993": "TM",
  "994": "AZ",
  "995": "GE",
  "996": "KG",
  "998": "UZ",
};

/**
 * Extracts country short name from phone number
 * @param phone - Phone number with country code (e.g., "+16379744779")
 * @returns ISO 2-letter country code or empty string
 */
function getCountryFromPhone(phone: string): string {
  // Remove + and any spaces/dashes
  const cleaned = phone.replace(/[\s\-\+]/g, "");

  // Try matching 3-digit codes first, then 2-digit, then 1-digit
  for (const len of [3, 2, 1]) {
    const code = cleaned.substring(0, len);
    if (CALLING_CODE_TO_COUNTRY[code]) {
      return CALLING_CODE_TO_COUNTRY[code];
    }
  }

  return "";
}

/**
 * Column IDs mapping for partner registration board
 * These need to match the column IDs in your Monday.com board
 *
 * To find column IDs, use the getBoard function:
 * ```typescript
 * import { getBoard, getConfigFromEnv } from "../monday";
 * const board = await getBoard(getConfigFromEnv());
 * console.log(board.columns);
 * ```
 */
const COLUMN_MAPPING = {
  // Actual column IDs from "New Digitalsite - Partner Account" board
  email: "email_mkn2x7rp", // Email column
  phone: "phone_mkqh939s", // Phone column
  payment: "numbers_mkn22v3y", // Payment (numbers) column - amount
  remaining: "numeric_mkpn2c5s", // Remaining (numbers) column - always 0
  paymentMethod: "dropdown_mkn2ahpq", // Payment Method (dropdown) - always Mamo Pay
  subscriptionDate: "date_mkppab9c", // Subscription Date column
  seller: "dropdown_mkn2my0r", // Seller (dropdown) - always Mamo
  paymentCompleted: "color_mkn29vz2", // Payment Completed (status) - Done
  readyToAdd: "color_mkpnc0w4", // Ready To Add (status) - Done
  addToDS: "color_mkn26kav", // Add to DS (status) - Done
  date: "date_mkn2z7rc", // Date column
  note: "text_mkn2vgtv", // Note (text) - transaction ID
  invitedBy: "multiple_person_mky77mx7",
};
const INVITED_BY_USER_ID = 74353384;

/**
 * Maps partner registration data to Monday.com column values format
 *
 * @param data - Partner registration data
 * @returns Column values object for Monday API
 */
function mapToColumnValues(
  data: PartnerRegistrationData
): Record<string, unknown> {
  const columnValues: Record<string, unknown> = {};

  // Email column (email type)
  columnValues[COLUMN_MAPPING.email] = {
    email: data.email,
    text: data.email,
  };

  // Phone column (phone type) - skip if empty or dash
  if (data.phone && data.phone !== "-") {
    columnValues[COLUMN_MAPPING.phone] = {
      phone: data.phone,
      countryShortName: getCountryFromPhone(data.phone),
    };
  }

  // Payment amount (numbers type)
  columnValues[COLUMN_MAPPING.payment] = data.amount;

  // Remaining - always 0
  columnValues[COLUMN_MAPPING.remaining] = 0;

  // Payment Method - always "Mamo Pay"
  columnValues[COLUMN_MAPPING.paymentMethod] = {
    labels: ["Mamo Pay"],
  };

  // Seller - always "Mamo"
  columnValues[COLUMN_MAPPING.seller] = {
    labels: ["Mamo"],
  };

  // Subscription Date (date type)
  const dateStr = new Date(data.createdAt).toISOString().split("T")[0];
  columnValues[COLUMN_MAPPING.subscriptionDate] = {
    date: dateStr,
  };

  // Date column (same as created_date)
  columnValues[COLUMN_MAPPING.date] = {
    date: dateStr,
  };

  // Note - transaction ID
  columnValues[COLUMN_MAPPING.note] = data.transactionId;

  // Payment Completed - Done
  columnValues[COLUMN_MAPPING.paymentCompleted] = {
    label: "Done",
  };

  // Ready To Add - Done
  columnValues[COLUMN_MAPPING.readyToAdd] = {
    label: "Done",
  };

  // Add to DS - Done
  columnValues[COLUMN_MAPPING.addToDS] = {
    label: "Done",
  };

  // Invited By - Ahmad Naser Almuhtar
  columnValues[COLUMN_MAPPING.invitedBy] = {
    personsAndTeams: [{ id: INVITED_BY_USER_ID, kind: "person" }],
  };

  return columnValues;
}

/**
 * Adds a partner registration to the Monday.com board
 * This is a non-blocking operation - errors are logged but not thrown
 *
 * @param data - Partner registration data
 * @returns Created item or null if failed
 *
 * @example
 * ```typescript
 * await addPartnerRegistration({
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@example.com",
 *   phone: "+1234567890",
 *   transactionId: "PAY-123456",
 *   amount: 59.99,
 *   currency: "USD",
 *   isNewUser: true,
 *   createdAt: new Date().toISOString()
 * });
 * ```
 */
export async function addPartnerRegistration(
  data: PartnerRegistrationData
): Promise<CreatedItem | null> {
  // Check if Monday integration is configured
  if (!isMondayConfigured()) {
    console.log(
      "[Monday] Integration not configured - skipping partner registration"
    );
    return null;
  }

  try {
    // Validate input data
    const validatedData = PartnerRegistrationDataSchema.parse(data);

    // Get config from environment
    const config = getConfigFromEnv();

    // Create item name from full name
    const itemName =
      `${validatedData.firstName} ${validatedData.lastName}`.trim();

    // Map data to column values
    const columnValues = mapToColumnValues(validatedData);

    console.log("[Monday] Adding partner registration:", {
      itemName,
      email: validatedData.email,
      transactionId: validatedData.transactionId,
    });

    // Create item on Monday board
    const item = await createItem(
      {
        boardId: config.boardId,
        groupId: config.groupId,
        itemName,
        columnValues,
      },
      config
    );

    console.log("[Monday] Partner registration added successfully:", {
      itemId: item.id,
      itemName: item.name,
    });

    return item;
  } catch (error) {
    // Log error but don't throw - this is a non-blocking operation
    console.error("[Monday] Failed to add partner registration:", error);
    return null;
  }
}

/**
 * Updates the column mapping based on your board's actual column IDs
 * Call this function and check the logs to see your board's columns:
 *
 * ```typescript
 * import { getBoard, getConfigFromEnv } from "../monday";
 * const board = await getBoard(getConfigFromEnv());
 * console.log("Board columns:", JSON.stringify(board.columns, null, 2));
 * ```
 *
 * Then update COLUMN_MAPPING at the top of this file with the correct IDs.
 */
