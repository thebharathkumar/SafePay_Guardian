// NACHA to ISO 20022 transformer
// Based on NACHA ACH file format

interface NACHAData {
  batchHeader?: {
    companyName?: string;
    companyId?: string;
    standardEntryClass?: string;
    entryDescription?: string;
    effectiveEntryDate?: string;
  };
  entryDetail?: {
    transactionCode?: string;
    receivingDFI?: string;
    checkDigit?: string;
    dfiAccountNumber?: string;
    amount?: string;
    individualId?: string;
    individualName?: string;
    traceNumber?: string;
  };
}

export function parseNACHA(content: string): NACHAData {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const data: NACHAData = {};

  for (const line of lines) {
    // Batch Header Record (5)
    if (line.startsWith('5')) {
      const serviceClassCode = line.substring(1, 4);
      const companyName = line.substring(4, 20).trim();
      const companyDiscretionaryData = line.substring(20, 40).trim();
      const companyId = line.substring(40, 50).trim();
      const standardEntryClass = line.substring(50, 53).trim();
      const entryDescription = line.substring(53, 63).trim();
      const effectiveEntryDate = line.substring(69, 75).trim();

      data.batchHeader = {
        companyName,
        companyId,
        standardEntryClass,
        entryDescription,
        effectiveEntryDate,
      };
    }
    // Entry Detail Record (6)
    else if (line.startsWith('6')) {
      const transactionCode = line.substring(1, 3);
      const receivingDFI = line.substring(3, 11);
      const checkDigit = line.substring(11, 12);
      const dfiAccountNumber = line.substring(12, 29).trim();
      const amount = line.substring(29, 39);
      const individualId = line.substring(39, 54).trim();
      const individualName = line.substring(54, 76).trim();
      const traceNumber = line.substring(79, 94).trim();

      data.entryDetail = {
        transactionCode,
        receivingDFI,
        checkDigit,
        dfiAccountNumber,
        amount,
        individualId,
        individualName,
        traceNumber,
      };
    }
  }

  return data;
}

export function convertNACHAToISO20022(data: NACHAData): string {
  const msgId = data.entryDetail?.traceNumber || 'MSG' + Date.now();
  const creDtTm = new Date().toISOString();
  
  const amountStr = data.entryDetail?.amount || '0';
  const amount = (parseInt(amountStr) / 100).toFixed(2);
  
  const companyName = data.batchHeader?.companyName || 'Unknown Company';
  const individualName = data.entryDetail?.individualName || 'Unknown Individual';
  const accountNumber = data.entryDetail?.dfiAccountNumber || 'Unknown';
  const description = data.batchHeader?.entryDescription || 'Payment';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INDA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${msgId}</InstrId>
        <EndToEndId>${msgId}</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="USD">${amount}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${data.batchHeader?.effectiveEntryDate || new Date().toISOString().split('T')[0]}</IntrBkSttlmDt>
      <ChrgBr>SHAR</ChrgBr>
      <Dbtr>
        <Nm>${companyName}</Nm>
        <Id>
          <OrgId>
            <Othr>
              <Id>${data.batchHeader?.companyId || 'Unknown'}</Id>
            </Othr>
          </OrgId>
        </Id>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <Othr>
            <Id>${data.batchHeader?.companyId || 'Unknown'}</Id>
          </Othr>
        </Id>
      </DbtrAcct>
      <Cdtr>
        <Nm>${individualName}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <Othr>
            <Id>${accountNumber}</Id>
          </Othr>
        </Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>${description}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

  return xml;
}

export function transformNACHA(content: string): { xml: string; data: NACHAData } {
  const data = parseNACHA(content);
  const xml = convertNACHAToISO20022(data);
  return { xml, data };
}
