# NACHA CCD Entry to ISO 20022 (pain.001.001.09) Mapping Table

## Complete Field Mapping with Transformation Logic

| NACHA Record | Field Position | Description | ISO 20022 Element | ISO 20022 Path | Notes | Transformation Logic |
|--------------|---------------|-------------|-------------------|----------------|-------|---------------------|
| 101 | Full Record | File Header | Message ID | /Document/CstmrCdtTrfInitn/GrpHdr/MsgId | Unique message identifier | Combine timestamp with batch ID (e.g., YYMMDDHHMMSS + batch number) |
| 101 | Immediate Origin | Originating DFI | Debtor Agent | /Document/CstmrCdtTrfInitn/PmtInf/DbtrAgt/FinInstnId/ClrSysMmbId/MmbId | Routing number of originating bank | Extract 9-digit routing number from positions 4-12 |
| 101 | Immediate Destination | Destination DFI | System Context | Header metadata | Receiving institution | Extract routing number from positions 13-21 (informational) |
| 101 | File Creation Date | File Date | Creation Date/Time | /Document/CstmrCdtTrfInitn/GrpHdr/CreDtTm | Timestamp of message creation | Convert YYMMDD to ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ) |
| 5225 | Full Record | Batch Header | Payment Info ID | /Document/CstmrCdtTrfInitn/PmtInf/PmtInfId | Batch identifier | Use company identification or generate unique batch ID |
| 5225 | Company Name | Company Name | Debtor Name | /Document/CstmrCdtTrfInitn/PmtInf/Dbtr/Nm | Name of the debtor/company | Direct copy from positions 41-56 |
| 5225 | Company Identification | Company ID | Debtor ID | /Document/CstmrCdtTrfInitn/GrpHdr/InitgPty/Id/OrgId/Othr/Id | Company tax ID or identifier | Extract from positions 41-50 |
| 5225 | Company Entry Description | Description | Payment Purpose | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/RmtInf/Ustrd | Purpose of payment (e.g., "Payroll Deposit") | Direct copy from positions 54-63 |
| 5225 | Effective Entry Date | Settlement Date | Requested Execution Date | /Document/CstmrCdtTrfInitn/PmtInf/ReqdExctnDt/Dt | Date funds should be available | Convert YYMMDD to YYYY-MM-DD format |
| 5225 | Originating DFI | Originating Bank | Debtor Agent | /Document/CstmrCdtTrfInitn/PmtInf/DbtrAgt/FinInstnId/ClrSysMmbId/MmbId | Routing number | Extract 8-digit routing number from positions 79-86 |
| 622 | Transaction Code | Transaction Type | Payment Method | /Document/CstmrCdtTrfInitn/PmtInf/PmtMtd | Credit (22) or Debit (27) | Map transaction code: 22 → TRF (credit), 27 → TRF (debit) |
| 622 | Receiving DFI | Receiving Bank | Creditor Agent | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/CdtrAgt/FinInstnId/ClrSysMmbId/MmbId | Receiving bank routing number | Extract 8 digits from positions 4-11 (exclude check digit) |
| 622 | DFI Account Number | Receiver Account | Creditor Account | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/CdtrAcct/Id/Othr/Id | Beneficiary account number | Extract from positions 12-28 (trim spaces) |
| 622 | Amount | Transaction Amount | Instructed Amount | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/Amt/InstdAmt | Payment amount in cents | Convert cents to dollars: divide by 100, format with 2 decimals |
| 622 | Individual Identification | Individual ID | End-to-End ID | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/PmtId/EndToEndId | Unique transaction reference | Extract from positions 39-53 (employee ID or reference) |
| 622 | Individual Name | Receiver Name | Creditor Name | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/Cdtr/Nm | Name of beneficiary | Extract from positions 54-75 (trim spaces) |
| 622 | Discretionary Data | Additional Info | Remittance Info | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/RmtInf/Ustrd | Additional payment details | Extract from positions 76-77 if present |
| 822 | Full Record | Batch Control | Control Sum | /Document/CstmrCdtTrfInitn/GrpHdr/CtrlSum | Total amount for validation | Sum all transaction amounts, convert from cents to dollars |
| 822 | Entry/Addenda Count | Entry Count | Number of Transactions | /Document/CstmrCdtTrfInitn/GrpHdr/NbOfTxs | Count of payment transactions | Extract from positions 2-7 |
| 822 | Total Debit Entry Dollar Amount | Total Debits | Validation Field | Informational | Total debits in batch | Convert from cents to dollars for validation |
| 822 | Total Credit Entry Dollar Amount | Total Credits | Validation Field | Informational | Total credits in batch | Convert from cents to dollars for validation |
| 900 | Full Record | File Control | Final Control | Metadata | File-level totals | Extract for validation: batch count, entry count, total amounts |
| Implied | Currency | Currency Code | Currency | /Document/CstmrCdtTrfInitn/PmtInf/CdtTrfTxInf/Amt/InstdAmt[@Ccy] | Always USD for NACHA | Hard-code to "USD" |
| Implied | Batch Booking | Batch Indicator | Batch Booking | /Document/CstmrCdtTrfInitn/PmtInf/BtchBookg | Process as batch | Set to "true" for batch processing |

## Data Transformation Rules

### Date Formatting
- **Input**: YYMMDD format in NACHA (e.g., 230906)
- **Output**: 
  - Date only: YYYY-MM-DD (e.g., 2023-09-06)
  - DateTime: YYYY-MM-DDTHH:MM:SSZ (e.g., 2023-09-06T00:00:00Z)
- **Logic**: Add century prefix (20), insert hyphens, add time component if needed

### Amount Formatting
- **Input**: Cents without decimal point (e.g., 0000125000 = $1,250.00)
- **Output**: Decimal format (e.g., 1250.00)
- **Logic**: 
  - Parse as integer
  - Divide by 100
  - Format with exactly 2 decimal places
  - Remove leading zeros

### Routing Number Handling
- **Input**: 9-digit routing number (8 digits + 1 check digit)
- **Output**: 8-digit clearing member ID (exclude check digit) or full 9 digits
- **Logic**: 
  - For Debtor Agent: Use full 9 digits or first 8
  - For Creditor Agent: Use first 8 digits (positions 4-11 of Entry Detail)
  - Validate check digit using standard algorithm

### Account Number Parsing
- **Input**: 17-character field (positions 12-28), may contain spaces
- **Output**: Trimmed account number
- **Logic**: 
  - Remove leading and trailing spaces
  - Preserve internal spaces if part of actual account number
  - Validate non-empty

### Name Field Processing
- **Input**: Fixed-width fields with potential padding spaces
- **Output**: Clean name strings
- **Logic**:
  - Trim leading and trailing spaces
  - Convert to proper case if needed
  - Handle formats like "Doe, John" or "John Doe"

### Transaction Code Mapping
- **Input**: 2-digit NACHA transaction code
- **Output**: Payment method type
- **Logic**:
  - 22 = Automated deposit (checking) → TRF
  - 27 = Automated payment (checking) → TRF
  - 32 = Automated deposit (savings) → TRF
  - 37 = Automated payment (savings) → TRF

### Company Identification
- **Input**: Company ID from positions 41-50 (may include tax ID)
- **Output**: Structured organization identifier
- **Logic**: Extract and validate format (typically EIN: XX-XXXXXXX)

## Record Structure Analysis

### File Header (Record Type 1)
- Positions 1-1: Record Type Code (1)
- Positions 2-3: Priority Code (01)
- Positions 4-13: Immediate Destination (routing number)
- Positions 14-23: Immediate Origin (company ID)
- Positions 24-29: File Creation Date (YYMMDD)
- Positions 30-33: File Creation Time (HHMM)
- Positions 34-94: Additional header info

### Batch Header (Record Type 5)
- Positions 1-1: Record Type Code (5)
- Positions 2-4: Service Class Code (225 = credits only)
- Positions 5-20: Company Name
- Positions 41-50: Company Identification
- Positions 54-63: Company Entry Description
- Positions 69-74: Effective Entry Date (YYMMDD)
- Positions 79-86: Originating DFI Identification

### Entry Detail (Record Type 6)
- Positions 1-1: Record Type Code (6)
- Positions 2-3: Transaction Code (22, 27, etc.)
- Positions 4-11: Receiving DFI Identification (8 digits)
- Positions 12-12: Check Digit
- Positions 13-29: DFI Account Number (17 chars)
- Positions 30-39: Amount (10 digits, implied 2 decimals)
- Positions 40-54: Individual Identification Number
- Positions 55-76: Individual Name (22 chars)
- Positions 77-78: Discretionary Data

### Batch Control (Record Type 8)
- Positions 1-1: Record Type Code (8)
- Positions 2-4: Service Class Code
- Positions 5-10: Entry/Addenda Count
- Positions 11-30: Entry Hash
- Positions 31-42: Total Debit Entry Dollar Amount
- Positions 43-54: Total Credit Entry Dollar Amount

### File Control (Record Type 9)
- Positions 1-1: Record Type Code (9)
- Positions 2-7: Batch Count
- Positions 8-13: Block Count
- Positions 14-21: Entry/Addenda Count
- Positions 22-31: Entry Hash
- Positions 32-43: Total Debit Amount
- Positions 44-55: Total Credit Amount

## Assumptions and Missing Data Handling

1. **Currency**: NACHA is USD-only, hard-code to "USD"
2. **Missing Beneficiary Address**: Not present in NACHA CCD; leave address fields empty or use "Unknown"
3. **Missing Debtor Address**: Extract from company name/ID if available, otherwise leave empty
4. **Message ID Generation**: Combine file date + time + batch number for uniqueness
5. **End-to-End ID**: Use Individual Identification Number from Entry Detail
6. **Payment Method**: Default to "TRF" (transfer) for all NACHA transactions
7. **Batch Booking**: Always set to "true" for NACHA batch files
8. **Time Component**: If not present in file header, default to 00:00:00Z

## Validation Requirements

1. **Routing Numbers**: Must be 9 digits, validate check digit
2. **Account Numbers**: Must be non-empty after trimming
3. **Amounts**: Must be positive integers in NACHA, properly converted to decimal
4. **Dates**: Must be valid dates in YYMMDD format
5. **Control Totals**: Batch control totals must match sum of individual entries
6. **Entry Count**: Must match actual number of Entry Detail records
7. **Transaction Codes**: Must be valid NACHA codes (22, 23, 24, 27, 28, 29, 32, 33, 34, 37, 38, 39)
8. **Service Class Codes**: 200 (mixed), 220 (credits), 225 (debits)

## Data Loss Risks

1. **Address Information**: NACHA CCD does not contain address details
2. **Purpose Codes**: Limited description field may not capture full payment purpose
3. **Intermediary Banks**: NACHA is typically direct; ISO 20022 supports intermediaries
4. **Structured Remittance**: NACHA uses unstructured; ISO 20022 supports both
5. **Additional Party Information**: Limited party details in NACHA vs. rich ISO 20022 structure
