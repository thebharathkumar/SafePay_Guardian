// MT103 to ISO 20022 transformer
// Based on SWIFT MT103 message format

interface MT103Data {
  transactionReference?: string;
  valueDate?: string;
  currency?: string;
  amount?: string;
  orderingCustomer?: string;
  beneficiary?: string;
  remittanceInfo?: string;
  detailsOfCharges?: string;
}

export function parseMT103(content: string): MT103Data {
  const lines = content.split('\n').map(line => line.trim());
  const data: MT103Data = {};

  for (const line of lines) {
    if (line.startsWith(':20:')) {
      data.transactionReference = line.substring(4).trim();
    } else if (line.startsWith(':32A:')) {
      const match = line.substring(5).match(/(\d{6})([A-Z]{3})([\d,\.]+)/);
      if (match) {
        data.valueDate = match[1];
        data.currency = match[2];
        // Handle both comma and period as decimal separator
        // MT103 uses comma as decimal separator (e.g., 2500,00 = 2500.00)
        const amountStr = match[3].replace(',', '.');
        data.amount = amountStr;
      }
    } else if (line.startsWith(':50K:')) {
      const startIndex = lines.indexOf(line);
      let orderingCustomer = '';
      for (let i = startIndex; i < lines.length; i++) {
        const currentLine = lines[i];
        if (i === startIndex) {
          orderingCustomer = currentLine.substring(5).trim();
        } else if (currentLine.startsWith(':')) {
          break;
        } else {
          orderingCustomer += '\n' + currentLine;
        }
      }
      data.orderingCustomer = orderingCustomer.trim();
    } else if (line.startsWith(':59:')) {
      const startIndex = lines.indexOf(line);
      let beneficiary = '';
      for (let i = startIndex; i < lines.length; i++) {
        const currentLine = lines[i];
        if (i === startIndex) {
          beneficiary = currentLine.substring(4).trim();
        } else if (currentLine.startsWith(':')) {
          break;
        } else {
          beneficiary += '\n' + currentLine;
        }
      }
      data.beneficiary = beneficiary.trim();
    } else if (line.startsWith(':70:')) {
      const startIndex = lines.indexOf(line);
      let remittance = '';
      for (let i = startIndex; i < lines.length; i++) {
        const currentLine = lines[i];
        if (i === startIndex) {
          remittance = currentLine.substring(4).trim();
        } else if (currentLine.startsWith(':')) {
          break;
        } else {
          remittance += '\n' + currentLine;
        }
      }
      data.remittanceInfo = remittance.trim();
    } else if (line.startsWith(':71A:')) {
      data.detailsOfCharges = line.substring(5).trim();
    }
  }

  return data;
}

export function convertMT103ToISO20022(data: MT103Data): string {
  const msgId = data.transactionReference || 'MSG' + Date.now();
  const creDtTm = new Date().toISOString();
  const amount = data.amount || '0.00';
  const currency = data.currency || 'USD';
  
  const senderLines = (data.orderingCustomer || 'Unknown Sender').split('\n');
  const senderName = senderLines[0] || 'Unknown';
  const senderAddress = senderLines.slice(1).join(', ') || 'Unknown Address';
  
  const beneficiaryLines = (data.beneficiary || 'Unknown Beneficiary').split('\n');
  const beneficiaryName = beneficiaryLines[0] || 'Unknown';
  const beneficiaryAddress = beneficiaryLines.slice(1).join(', ') || 'Unknown Address';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>INGA</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${msgId}</InstrId>
        <EndToEndId>${msgId}</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${currency}">${amount}</IntrBkSttlmAmt>
      <IntrBkSttlmDt>${data.valueDate || new Date().toISOString().split('T')[0]}</IntrBkSttlmDt>
      <ChrgBr>${data.detailsOfCharges || 'SHAR'}</ChrgBr>
      <Dbtr>
        <Nm>${senderName}</Nm>
        <PstlAdr>
          <AdrLine>${senderAddress}</AdrLine>
        </PstlAdr>
      </Dbtr>
      <Cdtr>
        <Nm>${beneficiaryName}</Nm>
        <PstlAdr>
          <AdrLine>${beneficiaryAddress}</AdrLine>
        </PstlAdr>
      </Cdtr>
      <RmtInf>
        <Ustrd>${data.remittanceInfo || 'Payment'}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;

  return xml;
}

export function transformMT103(content: string): { xml: string; data: MT103Data } {
  const data = parseMT103(content);
  const xml = convertMT103ToISO20022(data);
  return { xml, data };
}
