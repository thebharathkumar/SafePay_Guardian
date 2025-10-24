#!/usr/bin/env python3
"""
NACHA CCD to ISO 20022 (pain.001.001.09) Transformation Script

This script transforms legacy NACHA ACH payment files into ISO 20022 XML format.
It includes parsing, validation, error handling, and XML generation.

Author: Legacy Payment Transformation Team
Date: 2024
"""

import re
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class NACHAParser:
    """Parser for NACHA ACH file format"""
    
    def __init__(self, nacha_text: str):
        self.raw_text = nacha_text
        self.file_header = {}
        self.batch_header = {}
        self.entries = []
        self.batch_control = {}
        self.file_control = {}
        
    def parse_file_header(self, line: str) -> Dict:
        """Parse File Header Record (Type 1)"""
        if not line.startswith('1'):
            return {}
        
        return {
            'record_type': line[0],
            'priority_code': line[1:3],
            'immediate_destination': line[3:13].strip(),
            'immediate_origin': line[13:23].strip(),
            'file_creation_date': line[23:29],
            'file_creation_time': line[29:33],
            'file_id_modifier': line[33],
        }
    
    def parse_batch_header(self, line: str) -> Dict:
        """Parse Batch Header Record (Type 5)"""
        if not line.startswith('5'):
            return {}
        
        return {
            'record_type': line[0],
            'service_class_code': line[1:4],
            'company_name': line[4:20].strip(),
            'company_discretionary_data': line[20:40].strip(),
            'company_identification': line[40:50].strip(),
            'standard_entry_class': line[50:53],
            'company_entry_description': line[53:63].strip(),
            'company_descriptive_date': line[63:69],
            'effective_entry_date': line[69:75],
            'originator_status_code': line[75],
            'originating_dfi': line[79:87],
        }
    
    def parse_entry_detail(self, line: str) -> Dict:
        """Parse Entry Detail Record (Type 6)"""
        if not line.startswith('6'):
            return {}
        
        return {
            'record_type': line[0],
            'transaction_code': line[1:3],
            'receiving_dfi': line[3:11],
            'check_digit': line[11],
            'dfi_account_number': line[12:29].strip(),
            'amount': line[29:39],
            'individual_identification': line[39:54].strip(),
            'individual_name': line[54:76].strip(),
            'discretionary_data': line[76:78],
            'addenda_record_indicator': line[78],
            'trace_number': line[79:94],
        }
    
    def parse_batch_control(self, line: str) -> Dict:
        """Parse Batch Control Record (Type 8)"""
        if not line.startswith('8'):
            return {}
        
        return {
            'record_type': line[0],
            'service_class_code': line[1:4],
            'entry_addenda_count': line[4:10],
            'entry_hash': line[10:20],
            'total_debit_amount': line[20:32],
            'total_credit_amount': line[32:44],
            'company_identification': line[44:54],
            'originating_dfi': line[79:87],
        }
    
    def parse_file_control(self, line: str) -> Dict:
        """Parse File Control Record (Type 9)"""
        if not line.startswith('9'):
            return {}
        
        return {
            'record_type': line[0],
            'batch_count': line[1:7],
            'block_count': line[7:13],
            'entry_addenda_count': line[13:21],
            'entry_hash': line[21:31],
            'total_debit_amount': line[31:43],
            'total_credit_amount': line[43:55],
        }
    
    def parse(self) -> bool:
        """Parse complete NACHA file"""
        logger.info("Starting NACHA file parsing")
        
        lines = self.raw_text.strip().split('\n')
        
        for line in lines:
            line = line.ljust(94)  # Ensure line is 94 characters
            
            record_type = line[0]
            
            if record_type == '1':
                self.file_header = self.parse_file_header(line)
                logger.debug(f"Parsed file header: {self.file_header}")
            elif record_type == '5':
                self.batch_header = self.parse_batch_header(line)
                logger.debug(f"Parsed batch header: {self.batch_header}")
            elif record_type == '6':
                entry = self.parse_entry_detail(line)
                self.entries.append(entry)
                logger.debug(f"Parsed entry: {entry}")
            elif record_type == '8':
                self.batch_control = self.parse_batch_control(line)
                logger.debug(f"Parsed batch control: {self.batch_control}")
            elif record_type == '9':
                self.file_control = self.parse_file_control(line)
                logger.debug(f"Parsed file control: {self.file_control}")
        
        logger.info(f"Parsed {len(self.entries)} entry records")
        return True


class NACHATransformer:
    """Transforms parsed NACHA data into ISO 20022 XML"""
    
    def __init__(self, parsed_nacha: NACHAParser):
        self.nacha = parsed_nacha
        self.errors = []
        self.warnings = []
        
    def validate_data(self) -> bool:
        """Validate required data is present"""
        if not self.nacha.batch_header:
            self.errors.append("Batch header is missing")
        
        if not self.nacha.entries:
            self.errors.append("No entry records found")
        
        # Validate amounts
        try:
            total_calculated = sum(int(entry['amount']) for entry in self.nacha.entries)
            total_control = int(self.nacha.batch_control.get('total_credit_amount', '0'))
            
            if total_calculated != total_control:
                self.warnings.append(
                    f"Amount mismatch: calculated {total_calculated}, control {total_control}"
                )
        except Exception as e:
            self.errors.append(f"Amount validation error: {e}")
        
        if self.errors:
            logger.error(f"Validation failed: {self.errors}")
            return False
        
        logger.info("Data validation passed")
        return True
    
    def format_date(self, yymmdd: str) -> str:
        """Convert YYMMDD to YYYY-MM-DD"""
        if len(yymmdd) != 6:
            return datetime.now().strftime('%Y-%m-%d')
        
        year = '20' + yymmdd[:2]
        month = yymmdd[2:4]
        day = yymmdd[4:6]
        
        return f"{year}-{month}-{day}"
    
    def format_amount(self, cents_str: str) -> str:
        """Convert cents string to dollar amount with 2 decimals"""
        try:
            cents = int(cents_str)
            dollars = cents / 100.0
            return f"{dollars:.2f}"
        except ValueError:
            logger.error(f"Invalid amount format: {cents_str}")
            return "0.00"
    
    def validate_routing_number(self, routing: str) -> bool:
        """Validate ABA routing number using check digit algorithm"""
        if len(routing) != 9 or not routing.isdigit():
            return False
        
        # ABA routing number check digit algorithm
        weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
        total = sum(int(d) * w for d, w in zip(routing, weights))
        
        return total % 10 == 0
    
    def create_iso20022_xml(self) -> ET.Element:
        """Generate ISO 20022 pain.001.001.09 XML structure"""
        logger.info("Creating ISO 20022 XML structure")
        
        # Create root element with namespace
        ns = "urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"
        ET.register_namespace('', ns)
        
        root = ET.Element('Document', xmlns=ns)
        cstmr_cdt_trf_initn = ET.SubElement(root, 'CstmrCdtTrfInitn')
        
        # Group Header
        grp_hdr = ET.SubElement(cstmr_cdt_trf_initn, 'GrpHdr')
        
        # Message ID: combine date and batch info
        msg_id = ET.SubElement(grp_hdr, 'MsgId')
        file_date = self.nacha.file_header.get('file_creation_date', '')
        batch_id = self.nacha.batch_header.get('company_identification', 'BATCH')
        msg_id.text = f"{file_date}{batch_id}"
        
        cre_dt_tm = ET.SubElement(grp_hdr, 'CreDtTm')
        cre_dt_tm.text = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
        
        nb_of_txs = ET.SubElement(grp_hdr, 'NbOfTxs')
        nb_of_txs.text = str(len(self.nacha.entries))
        
        # Calculate control sum
        total_amount = sum(int(entry['amount']) for entry in self.nacha.entries) / 100.0
        ctrl_sum = ET.SubElement(grp_hdr, 'CtrlSum')
        ctrl_sum.text = f"{total_amount:.2f}"
        
        # Initiating Party
        initg_pty = ET.SubElement(grp_hdr, 'InitgPty')
        initg_pty_nm = ET.SubElement(initg_pty, 'Nm')
        initg_pty_nm.text = self.nacha.batch_header.get('company_name', 'UNKNOWN')
        
        initg_pty_id = ET.SubElement(initg_pty, 'Id')
        org_id = ET.SubElement(initg_pty_id, 'OrgId')
        othr = ET.SubElement(org_id, 'Othr')
        othr_id = ET.SubElement(othr, 'Id')
        othr_id.text = self.nacha.batch_header.get('company_identification', 'UNKNOWN')
        
        # Payment Information
        pmt_inf = ET.SubElement(cstmr_cdt_trf_initn, 'PmtInf')
        
        pmt_inf_id = ET.SubElement(pmt_inf, 'PmtInfId')
        pmt_inf_id.text = self.nacha.batch_header.get('company_identification', 'BATCH001')
        
        pmt_mtd = ET.SubElement(pmt_inf, 'PmtMtd')
        pmt_mtd.text = 'TRF'
        
        btch_bookg = ET.SubElement(pmt_inf, 'BtchBookg')
        btch_bookg.text = 'true'
        
        # Requested Execution Date
        reqd_exctn_dt = ET.SubElement(pmt_inf, 'ReqdExctnDt')
        dt = ET.SubElement(reqd_exctn_dt, 'Dt')
        effective_date = self.nacha.batch_header.get('effective_entry_date', '')
        dt.text = self.format_date(effective_date)
        
        # Debtor
        dbtr = ET.SubElement(pmt_inf, 'Dbtr')
        dbtr_nm = ET.SubElement(dbtr, 'Nm')
        dbtr_nm.text = self.nacha.batch_header.get('company_name', 'UNKNOWN')
        
        # Debtor Agent
        dbtr_agt = ET.SubElement(pmt_inf, 'DbtrAgt')
        fin_instn_id = ET.SubElement(dbtr_agt, 'FinInstnId')
        clr_sys_mmb_id = ET.SubElement(fin_instn_id, 'ClrSysMmbId')
        mmb_id = ET.SubElement(clr_sys_mmb_id, 'MmbId')
        mmb_id.text = self.nacha.batch_header.get('originating_dfi', 'UNKNOWN')
        
        # Process each entry
        for entry in self.nacha.entries:
            self._add_credit_transfer_transaction(pmt_inf, entry)
        
        return root
    
    def _add_credit_transfer_transaction(self, pmt_inf: ET.Element, entry: Dict):
        """Add a credit transfer transaction for each NACHA entry"""
        cdt_trf_tx_inf = ET.SubElement(pmt_inf, 'CdtTrfTxInf')
        
        # Payment ID
        pmt_id = ET.SubElement(cdt_trf_tx_inf, 'PmtId')
        end_to_end_id = ET.SubElement(pmt_id, 'EndToEndId')
        end_to_end_id.text = entry.get('individual_identification', entry.get('trace_number', 'UNKNOWN'))
        
        # Amount
        amt = ET.SubElement(cdt_trf_tx_inf, 'Amt')
        instd_amt = ET.SubElement(amt, 'InstdAmt', Ccy='USD')
        instd_amt.text = self.format_amount(entry['amount'])
        
        # Creditor Agent
        cdtr_agt = ET.SubElement(cdt_trf_tx_inf, 'CdtrAgt')
        fin_instn_id = ET.SubElement(cdtr_agt, 'FinInstnId')
        clr_sys_mmb_id = ET.SubElement(fin_instn_id, 'ClrSysMmbId')
        mmb_id = ET.SubElement(clr_sys_mmb_id, 'MmbId')
        mmb_id.text = entry.get('receiving_dfi', 'UNKNOWN')
        
        # Creditor
        cdtr = ET.SubElement(cdt_trf_tx_inf, 'Cdtr')
        cdtr_nm = ET.SubElement(cdtr, 'Nm')
        cdtr_nm.text = entry.get('individual_name', 'UNKNOWN')
        
        # Creditor Account
        cdtr_acct = ET.SubElement(cdt_trf_tx_inf, 'CdtrAcct')
        cdtr_acct_id = ET.SubElement(cdtr_acct, 'Id')
        othr = ET.SubElement(cdtr_acct_id, 'Othr')
        othr_id = ET.SubElement(othr, 'Id')
        othr_id.text = entry.get('dfi_account_number', 'UNKNOWN')
        
        # Remittance Information
        company_desc = self.nacha.batch_header.get('company_entry_description', '')
        if company_desc:
            rmt_inf = ET.SubElement(cdt_trf_tx_inf, 'RmtInf')
            ustrd = ET.SubElement(rmt_inf, 'Ustrd')
            ustrd.text = company_desc
    
    def to_xml_string(self, root: ET.Element) -> str:
        """Convert XML tree to pretty-printed string"""
        rough_string = ET.tostring(root, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="    ", encoding='UTF-8').decode('utf-8')


def transform_nacha_to_iso20022(nacha_text: str, output_file: Optional[str] = None) -> str:
    """
    Main transformation function
    
    Args:
        nacha_text: Raw NACHA file text
        output_file: Optional file path to write XML output
    
    Returns:
        ISO 20022 XML string
    """
    try:
        # Parse NACHA
        parser = NACHAParser(nacha_text)
        if not parser.parse():
            raise ValueError("Failed to parse NACHA file")
        
        # Transform to ISO 20022
        transformer = NACHATransformer(parser)
        
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
    # Sample NACHA file (simplified)
    sample_nacha = """101 123456789 987654321230906A094101BankName                         
5225CompanyName            987654321PPDPayroll         230906  1123456789      
62298765432100012500000000000000000000000000000000000000000000000123456789Doe, John                      
822000000100098765432100001250000000000000000000987654321                       
9000001000001000000001250000000000000000000"""
    
    try:
        xml_output = transform_nacha_to_iso20022(
            sample_nacha,
            output_file='nacha_transformed.xml'
        )
        print("Transformation successful!")
        print("\nGenerated XML (first 500 chars):")
        print(xml_output[:500])
    except Exception as e:
        print(f"Error: {e}")
