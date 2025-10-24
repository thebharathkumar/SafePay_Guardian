#!/usr/bin/env python3
"""
SWIFT MT103 to ISO 20022 (pacs.008.001.08) Transformation Script

This script transforms legacy SWIFT MT103 payment messages into ISO 20022 XML format.
It includes parsing, validation, error handling, and XML generation.

Author: Legacy Payment Transformation Team
Date: 2024
"""

import re
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
from typing import Dict, Optional, List, Tuple
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MT103Parser:
    """Parser for SWIFT MT103 message format"""
    
    def __init__(self, mt103_text: str):
        self.raw_text = mt103_text
        self.fields = {}
        
    def parse(self) -> Dict[str, str]:
        """Parse MT103 message into field dictionary"""
        logger.info("Starting MT103 parsing")
        
        # Parse each field using regex patterns
        patterns = {
            '20': r':20:([^\n:]+)',
            '23B': r':23B:([^\n:]+)',
            '32A': r':32A:([^\n:]+)',
            '50K': r':50K:((?:[^\n:]+\n?)+?)(?=:\d{2}[A-Z]?:|\Z)',
            '59': r':59:((?:[^\n:]+\n?)+?)(?=:\d{2}[A-Z]?:|\Z)',
            '70': r':70:((?:[^\n:]+\n?)+?)(?=:\d{2}[A-Z]?:|\Z)',
            '71A': r':71A:([^\n:]+)',
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, self.raw_text, re.MULTILINE)
            if match:
                self.fields[field] = match.group(1).strip()
                logger.debug(f"Parsed field {field}: {self.fields[field][:50]}...")
            else:
                logger.warning(f"Field {field} not found in message")
        
        return self.fields


class MT103Transformer:
    """Transforms parsed MT103 data into ISO 20022 XML"""
    
    def __init__(self, parsed_data: Dict[str, str]):
        self.data = parsed_data
        self.errors = []
        self.warnings = []
        
    def validate_data(self) -> bool:
        """Validate required fields are present"""
        required_fields = ['20', '32A', '50K', '59']
        
        for field in required_fields:
            if field not in self.data or not self.data[field]:
                self.errors.append(f"Required field {field} is missing")
        
        if self.errors:
            logger.error(f"Validation failed: {self.errors}")
            return False
        
        logger.info("Data validation passed")
        return True
    
    def parse_field_32a(self) -> Tuple[str, str, str]:
        """
        Parse field 32A: Value Date, Currency, Amount
        Format: YYMMDDCCCAMOUNT (e.g., 231006USD12500,00)
        Returns: (date, currency, amount)
        """
        field_32a = self.data.get('32A', '')
        
        # Extract date (first 6 characters)
        date_str = field_32a[:6]
        year = '20' + date_str[:2]
        month = date_str[2:4]
        day = date_str[4:6]
        iso_date = f"{year}-{month}-{day}"
        
        # Extract currency (next 3 characters)
        currency = field_32a[6:9]
        
        # Extract amount (remaining characters)
        amount_str = field_32a[9:].replace(',', '.')
        
        # Format amount with 2 decimal places
        try:
            amount = f"{float(amount_str):.2f}"
        except ValueError:
            logger.error(f"Invalid amount format: {amount_str}")
            amount = "0.00"
            self.errors.append(f"Invalid amount in field 32A: {amount_str}")
        
        return iso_date, currency, amount
    
    def parse_address_field(self, field_content: str) -> Dict[str, str]:
        """
        Parse address from fields 50K or 59
        Returns dictionary with name and address components
        """
        lines = field_content.split('\n')
        result = {
            'name': '',
            'street': '',
            'city': '',
            'state': '',
            'postal_code': '',
            'country': 'US'
        }
        
        if len(lines) > 0:
            result['name'] = lines[0].strip()
        
        if len(lines) > 1:
            result['street'] = lines[1].strip()
        
        if len(lines) > 2:
            # Try to parse "City State ZIP" format
            city_line = lines[2].strip()
            match = re.match(r'^(.+?)\s+([A-Z]{2})\s+(\d{5})$', city_line)
            if match:
                result['city'] = match.group(1)
                result['state'] = match.group(2)
                result['postal_code'] = match.group(3)
            else:
                result['city'] = city_line
        
        return result
    
    def create_iso20022_xml(self) -> ET.Element:
        """Generate ISO 20022 pacs.008.001.08 XML structure"""
        logger.info("Creating ISO 20022 XML structure")
        
        # Parse date, currency, amount
        settlement_date, currency, amount = self.parse_field_32a()
        
        # Parse ordering customer (debtor)
        debtor_info = self.parse_address_field(self.data.get('50K', ''))
        
        # Parse beneficiary (creditor)
        creditor_info = self.parse_address_field(self.data.get('59', ''))
        
        # Create root element with namespace
        ns = "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08"
        ET.register_namespace('', ns)
        
        root = ET.Element('Document', xmlns=ns)
        fi_to_fi = ET.SubElement(root, 'FIToFICstmrCdtTrf')
        
        # Group Header
        grp_hdr = ET.SubElement(fi_to_fi, 'GrpHdr')
        
        msg_id = ET.SubElement(grp_hdr, 'MsgId')
        msg_id.text = self.data.get('20', 'UNKNOWN')
        
        cre_dt_tm = ET.SubElement(grp_hdr, 'CreDtTm')
        cre_dt_tm.text = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        nb_of_txs = ET.SubElement(grp_hdr, 'NbOfTxs')
        nb_of_txs.text = '1'
        
        ctrl_sum = ET.SubElement(grp_hdr, 'CtrlSum')
        ctrl_sum.text = amount
        
        ttl_intrbnk_sttlm_amt = ET.SubElement(grp_hdr, 'TtlIntrBkSttlmAmt', Ccy=currency)
        ttl_intrbnk_sttlm_amt.text = amount
        
        intrbnk_sttlm_dt = ET.SubElement(grp_hdr, 'IntrBkSttlmDt')
        intrbnk_sttlm_dt.text = settlement_date
        
        sttlm_inf = ET.SubElement(grp_hdr, 'SttlmInf')
        sttlm_mtd = ET.SubElement(sttlm_inf, 'SttlmMtd')
        sttlm_mtd.text = 'CLRG'
        
        # Credit Transfer Transaction Information
        cdt_trf_tx_inf = ET.SubElement(fi_to_fi, 'CdtTrfTxInf')
        
        # Payment Identification
        pmt_id = ET.SubElement(cdt_trf_tx_inf, 'PmtId')
        
        instr_id = ET.SubElement(pmt_id, 'InstrId')
        instr_id.text = self.data.get('20', 'UNKNOWN')
        
        end_to_end_id = ET.SubElement(pmt_id, 'EndToEndId')
        end_to_end_id.text = self.data.get('20', 'UNKNOWN')
        
        tx_id = ET.SubElement(pmt_id, 'TxId')
        tx_id.text = self.data.get('20', 'UNKNOWN')
        
        # Amount
        intrbnk_sttlm_amt2 = ET.SubElement(cdt_trf_tx_inf, 'IntrBkSttlmAmt', Ccy=currency)
        intrbnk_sttlm_amt2.text = amount
        
        intrbnk_sttlm_dt2 = ET.SubElement(cdt_trf_tx_inf, 'IntrBkSttlmDt')
        intrbnk_sttlm_dt2.text = settlement_date
        
        # Charge Bearer
        chrg_br = ET.SubElement(cdt_trf_tx_inf, 'ChrgBr')
        chrg_br.text = self.data.get('71A', 'SHA')
        
        # Debtor (Ordering Customer)
        dbtr = ET.SubElement(cdt_trf_tx_inf, 'Dbtr')
        dbtr_nm = ET.SubElement(dbtr, 'Nm')
        dbtr_nm.text = debtor_info['name']
        
        if debtor_info['street'] or debtor_info['city']:
            dbtr_pstl_adr = ET.SubElement(dbtr, 'PstlAdr')
            
            if debtor_info['street']:
                strt_nm = ET.SubElement(dbtr_pstl_adr, 'StrtNm')
                strt_nm.text = debtor_info['street']
            
            if debtor_info['city']:
                twn_nm = ET.SubElement(dbtr_pstl_adr, 'TwnNm')
                twn_nm.text = debtor_info['city']
            
            if debtor_info['state']:
                ctry_sub_dvsn = ET.SubElement(dbtr_pstl_adr, 'CtrySubDvsn')
                ctry_sub_dvsn.text = debtor_info['state']
            
            if debtor_info['postal_code']:
                pst_cd = ET.SubElement(dbtr_pstl_adr, 'PstCd')
                pst_cd.text = debtor_info['postal_code']
            
            ctry = ET.SubElement(dbtr_pstl_adr, 'Ctry')
            ctry.text = debtor_info['country']
        
        # Debtor Agent (placeholder)
        dbtr_agt = ET.SubElement(cdt_trf_tx_inf, 'DbtrAgt')
        fin_instn_id = ET.SubElement(dbtr_agt, 'FinInstnId')
        clr_sys_mmb_id = ET.SubElement(fin_instn_id, 'ClrSysMmbId')
        mmb_id = ET.SubElement(clr_sys_mmb_id, 'MmbId')
        mmb_id.text = 'SENDERBANK'
        
        # Creditor Agent (placeholder)
        cdtr_agt = ET.SubElement(cdt_trf_tx_inf, 'CdtrAgt')
        fin_instn_id2 = ET.SubElement(cdtr_agt, 'FinInstnId')
        clr_sys_mmb_id2 = ET.SubElement(fin_instn_id2, 'ClrSysMmbId')
        mmb_id2 = ET.SubElement(clr_sys_mmb_id2, 'MmbId')
        mmb_id2.text = 'RECEIVINGBANK'
        
        # Creditor (Beneficiary)
        cdtr = ET.SubElement(cdt_trf_tx_inf, 'Cdtr')
        cdtr_nm = ET.SubElement(cdtr, 'Nm')
        cdtr_nm.text = creditor_info['name']
        
        if creditor_info['street'] or creditor_info['city']:
            cdtr_pstl_adr = ET.SubElement(cdtr, 'PstlAdr')
            
            if creditor_info['street']:
                strt_nm2 = ET.SubElement(cdtr_pstl_adr, 'StrtNm')
                strt_nm2.text = creditor_info['street']
            
            if creditor_info['city']:
                twn_nm2 = ET.SubElement(cdtr_pstl_adr, 'TwnNm')
                twn_nm2.text = creditor_info['city']
            
            if creditor_info['state']:
                ctry_sub_dvsn2 = ET.SubElement(cdtr_pstl_adr, 'CtrySubDvsn')
                ctry_sub_dvsn2.text = creditor_info['state']
            
            if creditor_info['postal_code']:
                pst_cd2 = ET.SubElement(cdtr_pstl_adr, 'PstCd')
                pst_cd2.text = creditor_info['postal_code']
            
            ctry2 = ET.SubElement(cdtr_pstl_adr, 'Ctry')
            ctry2.text = creditor_info['country']
        
        # Remittance Information
        if '70' in self.data:
            rmt_inf = ET.SubElement(cdt_trf_tx_inf, 'RmtInf')
            ustrd = ET.SubElement(rmt_inf, 'Ustrd')
            ustrd.text = self.data['70']
        
        return root
    
    def to_xml_string(self, root: ET.Element) -> str:
        """Convert XML tree to pretty-printed string"""
        rough_string = ET.tostring(root, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="    ", encoding='UTF-8').decode('utf-8')


def transform_mt103_to_iso20022(mt103_text: str, output_file: Optional[str] = None) -> str:
    """
    Main transformation function
    
    Args:
        mt103_text: Raw MT103 message text
        output_file: Optional file path to write XML output
    
    Returns:
        ISO 20022 XML string
    """
    try:
        # Parse MT103
        parser = MT103Parser(mt103_text)
        parsed_data = parser.parse()
        
        if not parsed_data:
            raise ValueError("Failed to parse MT103 message - no fields found")
        
        # Transform to ISO 20022
        transformer = MT103Transformer(parsed_data)
        
        if not transformer.validate_data():
            raise ValueError(f"Validation failed: {transformer.errors}")
        
        xml_root = transformer.create_iso20022_xml()
        xml_string = transformer.to_xml_string(xml_root)
        
        # Write to file if specified
        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(xml_string)
            logger.info(f"XML written to {output_file}")
        
        if transformer.warnings:
            logger.warning(f"Transformation completed with warnings: {transformer.warnings}")
        else:
            logger.info("Transformation completed successfully")
        
        return xml_string
    
    except Exception as e:
        logger.error(f"Transformation failed: {str(e)}")
        raise


# Example usage
if __name__ == "__main__":
    # Sample MT103 message
    sample_mt103 = """
:20:TRX123456789
:23B:CRED
:32A:231006USD12500,00
:50K:John Doe
123 Main Street
White Plains NY 10601
:59:Jane Smith
456 Elm Street
Yonkers NY 10701
:70:Invoice 2023-09-001
:71A:SHA
"""
    
    try:
        xml_output = transform_mt103_to_iso20022(
            sample_mt103,
            output_file='mt103_transformed.xml'
        )
        print("Transformation successful!")
        print("\nGenerated XML (first 500 chars):")
        print(xml_output[:500])
    except Exception as e:
        print(f"Error: {e}")
