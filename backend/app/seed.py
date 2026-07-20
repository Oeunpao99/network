from datetime import date, datetime

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Activity, Circuit, Customer, CustomerSite, InfrastructureAsset, Invoice, Pop, ProductOffering, Quote, ServiceContract, Ticket

POPS = [
    {"code": "POP-WPH", "name": "Wat Phnom Exchange", "latitude": 11.5925, "longitude": 104.9282, "ports_total": 96, "ports_used": 71, "switch_id": "SW-CORE-01"},
    {"code": "POP-CCV", "name": "Chroy Changvar POP", "latitude": 11.5975, "longitude": 104.9420, "ports_total": 48, "ports_used": 22, "switch_id": "SW-EDGE-04"},
    {"code": "POP-TLK", "name": "Toul Kork Exchange", "latitude": 11.5794, "longitude": 104.8925, "ports_total": 96, "ports_used": 88, "switch_id": "SW-CORE-02"},
    {"code": "POP-BKK", "name": "BKK1 POP", "latitude": 11.5537, "longitude": 104.9282, "ports_total": 64, "ports_used": 40, "switch_id": "SW-EDGE-07"},
]

SITES = [
    {"code": "SITE-01", "name": "Aeon Mall Sen Sok", "latitude": 11.5730, "longitude": 104.8890},
    {"code": "SITE-02", "name": "Attwood Business Center", "latitude": 11.5580, "longitude": 104.9270},
    {"code": "SITE-03", "name": "Diamond Island Convention Ctr", "latitude": 11.5560, "longitude": 104.9330},
    {"code": "SITE-04", "name": "Olympia City Complex", "latitude": 11.5670, "longitude": 104.9130},
    {"code": "SITE-05", "name": "Chip Mong Tower 88", "latitude": 11.5620, "longitude": 104.9200},
    {"code": "SITE-06", "name": "Chroy Changvar Riverside Hotel", "latitude": 11.6000, "longitude": 104.9450},
    {"code": "SITE-07", "name": "Central Market Business Hub", "latitude": 11.5680, "longitude": 104.9210},
    {"code": "SITE-08", "name": "Koh Pich Tower", "latitude": 11.5540, "longitude": 104.9300},
]

CUSTOMERS = [
    {"name": "Aeon Mall Sen Sok Co., Ltd", "site": "SITE-01", "pop": "POP-TLK", "plan": "Enterprise Dedicated 10G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 2400, "tenure": "3.2 yrs", "port": "GE0/1/14", "reasons": []},
    {"name": "Attwood Business Center", "site": "SITE-02", "pop": "POP-BKK", "plan": "Fiber Pro 1G", "account_type": "SME", "verification_status": "KYB Verified", "status": "At Risk", "risk": "High", "monthly_value": 680, "tenure": "1.1 yrs", "port": "GE0/2/03", "reasons": ["3 failed payments", "2 open tickets", "Avg latency +40%"]},
    {"name": "Diamond Island Convention Ctr", "site": "SITE-03", "pop": "POP-BKK", "plan": "Enterprise Dedicated 10G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 3100, "tenure": "4.0 yrs", "port": "GE0/2/11", "reasons": []},
    {"name": "Olympia City Complex", "site": "SITE-04", "pop": "POP-TLK", "plan": "Fiber Business 500", "account_type": "SME", "verification_status": "Pending", "status": "Onboarding", "risk": "Medium", "monthly_value": 420, "tenure": "0.2 yrs", "port": "GE0/1/29", "reasons": ["Install delayed 6 days", "Port capacity at 92% on exchange"]},
    {"name": "Chip Mong Tower 88", "site": "SITE-05", "pop": "POP-BKK", "plan": "Fiber Pro 1G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 680, "tenure": "2.4 yrs", "port": "GE0/2/18", "reasons": []},
    {"name": "Chroy Changvar Riverside Hotel", "site": "SITE-06", "pop": "POP-CCV", "plan": "Fiber Business 500", "account_type": "SME", "verification_status": "KYB Verified", "status": "At Risk", "risk": "High", "monthly_value": 420, "tenure": "0.9 yrs", "port": "GE0/4/02", "reasons": ["4 outage tickets in 30 days", "NPS score dropped to 3"]},
    {"name": "Central Market Business Hub", "site": "SITE-07", "pop": "POP-WPH", "plan": "Fiber Essential 100", "account_type": "SME", "verification_status": "KYB Verified", "status": "Active", "risk": "Medium", "monthly_value": 180, "tenure": "1.6 yrs", "port": "GE0/0/33", "reasons": ["Usage near plan cap"]},
    {"name": "Koh Pich Tower", "site": "SITE-08", "pop": "POP-BKK", "plan": "Enterprise Dedicated 10G", "account_type": "Enterprise", "verification_status": "KYB Verified", "status": "Active", "risk": "Low", "monthly_value": 2950, "tenure": "3.7 yrs", "port": "GE0/2/25", "reasons": []},
    {"name": "Fiberline SME - Riverside Traders", "site": "SITE-07", "pop": "POP-WPH", "plan": "Fiber Essential 100", "account_type": "SME", "verification_status": "KYB Verified", "status": "Suspended", "risk": "High", "monthly_value": 0, "tenure": "0.8 yrs", "port": "GE0/0/41", "reasons": ["Suspended - non-payment 45 days"]},
    {"name": "Sen Sok Medical Plaza", "site": "SITE-01", "pop": "POP-TLK", "plan": "Fiber Business 500", "account_type": "SME", "verification_status": "KYB Verified", "status": "Active", "risk": "Medium", "monthly_value": 420, "tenure": "1.3 yrs", "port": "GE0/1/07", "reasons": ["Exchange nearing port capacity"]},
]

TICKETS = [
    {"id": "TCK-2291", "customer": "Aeon Mall Sen Sok Co., Ltd", "text": "Scheduled maintenance window confirmed", "opened_on": "2024-07-12"},
    {"id": "TCK-2287", "customer": "Attwood Business Center", "text": "Repeated packet loss reported", "opened_on": "2024-07-10"},
    {"id": "TCK-2270", "customer": "Attwood Business Center", "text": "Billing dispute - overcharge claim", "opened_on": "2024-07-03"},
    {"id": "TCK-2299", "customer": "Olympia City Complex", "text": "Install crew rescheduled", "opened_on": "2024-07-14"},
    {"id": "TCK-2280", "customer": "Chroy Changvar Riverside Hotel", "text": "Fiber cut - riverside construction", "opened_on": "2024-07-08"},
    {"id": "TCK-2265", "customer": "Chroy Changvar Riverside Hotel", "text": "Second outage this month", "opened_on": "2024-07-01"},
    {"id": "TCK-2201", "customer": "Fiberline SME - Riverside Traders", "text": "Service suspended per policy", "opened_on": "2024-06-29"},
]

INVOICES = [
    {"id": "INV-2024-001", "customer": "Aeon Mall Sen Sok Co., Ltd", "amount": 2400, "status": "paid", "issued": "2024-07-01", "due": "2024-07-15", "paid": "2024-07-12"},
    {"id": "INV-2024-002", "customer": "Attwood Business Center", "amount": 680, "status": "overdue", "issued": "2024-06-01", "due": "2024-06-15", "paid": None},
    {"id": "INV-2024-003", "customer": "Diamond Island Convention Ctr", "amount": 3100, "status": "paid", "issued": "2024-07-01", "due": "2024-07-15", "paid": "2024-07-10"},
    {"id": "INV-2024-004", "customer": "Olympia City Complex", "amount": 420, "status": "pending", "issued": "2024-07-01", "due": "2024-07-22", "paid": None},
    {"id": "INV-2024-005", "customer": "Chip Mong Tower 88", "amount": 680, "status": "paid", "issued": "2024-06-01", "due": "2024-06-15", "paid": "2024-06-14"},
    {"id": "INV-2024-006", "customer": "Chroy Changvar Riverside Hotel", "amount": 420, "status": "overdue", "issued": "2024-05-01", "due": "2024-05-15", "paid": None},
    {"id": "INV-2024-007", "customer": "Central Market Business Hub", "amount": 180, "status": "paid", "issued": "2024-07-01", "due": "2024-07-15", "paid": "2024-07-14"},
    {"id": "INV-2024-008", "customer": "Koh Pich Tower", "amount": 2950, "status": "pending", "issued": "2024-07-01", "due": "2024-07-20", "paid": None},
    {"id": "INV-2024-009", "customer": "Fiberline SME - Riverside Traders", "amount": 180, "status": "overdue", "issued": "2024-04-01", "due": "2024-04-15", "paid": None},
    {"id": "INV-2024-010", "customer": "Sen Sok Medical Plaza", "amount": 420, "status": "paid", "issued": "2024-06-01", "due": "2024-06-15", "paid": "2024-06-13"},
    {"id": "INV-2024-011", "customer": "Attwood Business Center", "amount": 680, "status": "pending", "issued": "2024-07-01", "due": "2024-07-15", "paid": None},
    {"id": "INV-2024-012", "customer": "Chroy Changvar Riverside Hotel", "amount": 420, "status": "pending", "issued": "2024-06-01", "due": "2024-06-15", "paid": None},
]

ACTIVITIES = [
    {"time_label": "09:41", "html": "<b>AI model</b> flagged Attwood Business Center as high churn risk"},
    {"time_label": "09:20", "html": "<b>Sereyvath R.</b> closed ticket TCK-2260 for Koh Pich Tower"},
    {"time_label": "08:55", "html": "Install crew dispatched for <b>Olympia City Complex</b>"},
    {"time_label": "08:12", "html": "<b>Chroy Changvar POP</b> port utilization crossed 45%"},
    {"time_label": "Yesterday", "html": "<b>Diamond Island Convention Ctr</b> upgraded to Enterprise Dedicated 10G"},
]

ASSETS = [
    {"code": "AST-001", "name": "Phnom Penh Metro Fiber Ring", "asset_type": "Fiber Route", "location_name": "Central Phnom Penh", "latitude": 11.5750, "longitude": 104.9180, "capacity_total": 144, "capacity_used": 92, "capacity_unit": "fiber cores", "status": "Active"},
    {"code": "AST-002", "name": "Riverside Cable Duct A", "asset_type": "Cable Duct", "location_name": "Sisowath Quay", "latitude": 11.5700, "longitude": 104.9290, "capacity_total": 48, "capacity_used": 34, "capacity_unit": "duct slots", "status": "Active"},
    {"code": "AST-003", "name": "BKK1 Tower Space", "asset_type": "Tower Space", "location_name": "BKK1", "latitude": 11.5520, "longitude": 104.9260, "capacity_total": 12, "capacity_used": 9, "capacity_unit": "antenna slots", "status": "Active"},
    {"code": "AST-004", "name": "Toul Kork Equipment Site", "asset_type": "Equipment Site", "location_name": "Toul Kork", "latitude": 11.5800, "longitude": 104.8910, "capacity_total": 40, "capacity_used": 31, "capacity_unit": "rack units", "status": "Active"},
]

CONTRACTS = [
    {"contract_number": "CON-001", "account_name": "Cambodian Health Ministry", "account_segment": "Enterprise", "product": "IPLC", "status": "Active", "start_date": "2024-01-01", "end_date": "2027-12-31", "monthly_value": 3500, "sla_availability": 99.95, "sla_mttr_hours": 4, "msa_number": "MSA-GOV-2024-01", "service_schedule_number": "SS-001", "route_diversity": "Dual route", "service_credit_rate": 10},
    {"contract_number": "CON-002", "account_name": "AngkorNet Carrier", "account_segment": "Carrier", "product": "IP Transit", "status": "Active", "start_date": "2024-04-01", "end_date": "2026-03-31", "monthly_value": 6200, "sla_availability": 99.90, "sla_mttr_hours": 4, "msa_number": "MSA-CAR-2024-07", "service_schedule_number": "SS-014", "route_diversity": "Standard", "service_credit_rate": 5},
    {"contract_number": "CON-003", "account_name": "Mekong Logistics", "account_segment": "Enterprise", "product": "DPLC", "status": "Feasibility", "start_date": "2025-01-01", "end_date": "2027-12-31", "monthly_value": 1800, "sla_availability": 99.90, "sla_mttr_hours": 8, "msa_number": "MSA-MEK-2025-01", "service_schedule_number": "SS-002", "route_diversity": "Pending survey", "service_credit_rate": 5},
]

PRODUCTS = [
    {"code": "PRD-HOME-100", "name": "TC-Home Fiber 100", "segment": "Residential", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 25},
    {"code": "PRD-BIZ-500", "name": "TC-Biz Fiber 500", "segment": "SME", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 120},
    {"code": "PRD-SIP-TRUNK", "name": "SIP Trunk", "segment": "SME", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 85},
    {"code": "PRD-VPBX", "name": "VPBX", "segment": "Enterprise", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 250},
    {"code": "PRD-IPLC", "name": "IPLC", "segment": "Enterprise", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-DPLC", "name": "DPLC", "segment": "Enterprise", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-IP-TRANSIT", "name": "IP Transit", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-FIBER-LEASE", "name": "Fiber Route Lease", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
]

QUOTES = [
    {"quote_number": "QTE-001", "account": "Aeon Mall Sen Sok Co., Ltd", "product": "PRD-VPBX", "status": "Approved", "feasibility_status": "Not required", "requested_capacity": "150 seats", "route_distance_km": None, "term_months": 24, "monthly_value": 250, "notes": "Additional branches included."},
    {"quote_number": "QTE-002", "account": "Diamond Island Convention Ctr", "product": "PRD-DPLC", "status": "Submitted", "feasibility_status": "Approved", "requested_capacity": "1 Gbps", "route_distance_km": 12.4, "term_months": 36, "monthly_value": 2800, "notes": "Dual route required between convention centre and DR site."},
]

CIRCUITS = [
    {"circuit_id": "CIR-PP-SIEM-01", "contract": "CON-001", "asset": "AST-001", "pop": "POP-BKK", "endpoint_a": "Phnom Penh Ministry DC", "endpoint_b": "Siem Reap Provincial Hospital", "bandwidth": "100 Mbps", "provisioning_stage": "Active", "status": "Active"},
    {"circuit_id": "CIR-ANGKOR-01", "contract": "CON-002", "asset": "AST-002", "pop": "POP-WPH", "endpoint_a": "AngkorNet Phnom Penh", "endpoint_b": "TC Core Gateway", "bandwidth": "10 Gbps", "provisioning_stage": "Active", "status": "Active"},
    {"circuit_id": "CIR-MEKONG-01", "contract": "CON-003", "asset": "AST-004", "pop": "POP-TLK", "endpoint_a": "Mekong Logistics HQ", "endpoint_b": "Mekong Warehouse", "bandwidth": "50 Mbps", "provisioning_stage": "Feasibility", "status": "Planned"},
]

POPS.extend([
    {"code": "POP-SR", "name": "Siem Reap Exchange", "latitude": 13.3633, "longitude": 103.8564, "ports_total": 72, "ports_used": 46, "switch_id": "SW-CORE-08"},
    {"code": "POP-SHV", "name": "Sihanoukville Gateway", "latitude": 10.6278, "longitude": 103.5228, "ports_total": 96, "ports_used": 82, "switch_id": "SW-CORE-11"},
    {"code": "POP-KDL", "name": "Kandal Access POP", "latitude": 11.4828, "longitude": 104.9524, "ports_total": 48, "ports_used": 18, "switch_id": "SW-EDGE-12"},
])

SITES.extend([
    {"code": "SITE-09", "name": "Phnom Penh Digital Plaza", "latitude": 11.5663, "longitude": 104.9232},
    {"code": "SITE-10", "name": "Kampong Cham Provincial Hospital", "latitude": 12.0017, "longitude": 105.4444},
    {"code": "SITE-11", "name": "MekongNet Carrier NOC", "latitude": 11.5574, "longitude": 104.9299},
    {"code": "SITE-12", "name": "Sihanoukville Port Authority", "latitude": 10.6252, "longitude": 103.5148},
    {"code": "SITE-13", "name": "Lotus Residence", "latitude": 11.5856, "longitude": 104.8867},
    {"code": "SITE-14", "name": "Angkor University", "latitude": 13.3612, "longitude": 103.8645},
    {"code": "SITE-15", "name": "Khmer Retail Group HQ", "latitude": 11.5704, "longitude": 104.9178},
    {"code": "SITE-16", "name": "Takeo Provincial Administration", "latitude": 10.9908, "longitude": 104.7841},
])

CUSTOMERS.extend([
    {"name": "Phnom Penh Digital Co.", "site": "SITE-09", "pop": "POP-WPH", "plan": "TC-Biz Fiber 500", "account_type": "SME", "verification_status": "KYB Verified", "billing_model": "Recurring", "status": "Active", "risk": "Low", "monthly_value": 120, "tenure": "2.1 yrs", "port": "GE0/0/52", "reasons": []},
    {"name": "Kampong Cham Provincial Hospital", "site": "SITE-10", "pop": "POP-KDL", "plan": "DPLC", "account_type": "Enterprise", "verification_status": "KYB Verified", "billing_model": "Recurring", "status": "Onboarding", "risk": "Medium", "monthly_value": 2900, "tenure": "New", "port": "GE0/12/04", "reasons": ["Route survey pending", "Dual-path design under review"]},
    {"name": "MekongNet Carrier Services", "site": "SITE-11", "pop": "POP-BKK", "plan": "IP Transit", "account_type": "Carrier", "verification_status": "KYB Verified", "billing_model": "Usage", "status": "Active", "risk": "Medium", "monthly_value": 8600, "tenure": "5.4 yrs", "port": "OTN-1/0/29", "reasons": ["Transit peak utilization above 80%"]},
    {"name": "Sihanoukville Port Authority", "site": "SITE-12", "pop": "POP-SHV", "plan": "Fiber Route Lease", "account_type": "Government", "verification_status": "KYB Verified", "billing_model": "Recurring", "status": "Active", "risk": "Low", "monthly_value": 4100, "tenure": "1.8 yrs", "port": "GE0/11/08", "reasons": []},
    {"name": "Lotus Residence", "site": "SITE-13", "pop": "POP-TLK", "plan": "TC-Home Fiber 300", "account_type": "Residential", "verification_status": "KYC Verified", "billing_model": "Recurring", "status": "Active", "risk": "Low", "monthly_value": 45, "tenure": "0.7 yrs", "port": "GE0/1/44", "reasons": []},
    {"name": "Angkor University", "site": "SITE-14", "pop": "POP-SR", "plan": "DPLC", "account_type": "Enterprise", "verification_status": "KYB Verified", "billing_model": "Recurring", "status": "Active", "risk": "Low", "monthly_value": 3600, "tenure": "3.6 yrs", "port": "GE0/8/12", "reasons": []},
    {"name": "Khmer Retail Group", "site": "SITE-15", "pop": "POP-WPH", "plan": "SIP Trunk", "account_type": "SME", "verification_status": "KYB Verified", "billing_model": "Consolidated Postpaid", "status": "At Risk", "risk": "High", "monthly_value": 980, "tenure": "2.8 yrs", "port": "GE0/0/56", "reasons": ["Two open voice quality incidents", "Invoice dispute awaiting review"]},
    {"name": "Takeo Provincial Administration", "site": "SITE-16", "pop": "POP-KDL", "plan": "TC-Enterprise", "account_type": "Government", "verification_status": "KYB Verified", "billing_model": "Recurring", "status": "Onboarding", "risk": "Medium", "monthly_value": 2250, "tenure": "New", "port": "GE0/12/06", "reasons": ["Installation scheduled for next week"]},
])

ASSETS.extend([
    {"code": "AST-005", "name": "Siem Reap Fiber Ring", "asset_type": "Fiber Route", "location_name": "Siem Reap city ring", "latitude": 13.3651, "longitude": 103.8534, "capacity_total": 96, "capacity_used": 54, "capacity_unit": "fiber cores", "status": "Active"},
    {"code": "AST-006", "name": "Sihanoukville Port Cable Duct", "asset_type": "Cable Duct", "location_name": "Port access road", "latitude": 10.6262, "longitude": 103.5186, "capacity_total": 36, "capacity_used": 30, "capacity_unit": "duct slots", "status": "Reserved"},
    {"code": "AST-007", "name": "Kandal Microwave Tower", "asset_type": "Tower Space", "location_name": "Ta Khmau", "latitude": 11.4844, "longitude": 104.9488, "capacity_total": 8, "capacity_used": 5, "capacity_unit": "antenna slots", "status": "Active"},
    {"code": "AST-008", "name": "Wat Phnom Voice Core Rack", "asset_type": "Equipment Site", "location_name": "Wat Phnom Exchange", "latitude": 11.5925, "longitude": 104.9282, "capacity_total": 42, "capacity_used": 38, "capacity_unit": "rack units", "status": "Maintenance"},
])

PRODUCTS.extend([
    {"code": "PRD-HOME-35", "name": "TC-Home Fiber 35", "segment": "Residential", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 15},
    {"code": "PRD-HOME-300", "name": "TC-Home Fiber 300", "segment": "Residential", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 45},
    {"code": "PRD-IP-PHONE", "name": "IP Phone", "segment": "SME", "commercial_model": "Subscription", "pricing_model": "Fixed", "base_monthly_price": 12},
    {"code": "PRD-VOICE-TRANSIT", "name": "Voice Transit", "segment": "Carrier", "commercial_model": "Wholesale", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-SMS-TRANSIT", "name": "SMS Transit", "segment": "Carrier", "commercial_model": "Wholesale", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-DIX", "name": "DIX Peering", "segment": "Carrier", "commercial_model": "Wholesale", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-E1", "name": "Leased Circuit E1", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-TOWER", "name": "Antenna and Tower Space", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
    {"code": "PRD-DUCT", "name": "Cable Duct Rental", "segment": "Carrier", "commercial_model": "Contract", "pricing_model": "Custom", "base_monthly_price": None},
])

CONTRACTS.extend([
    {"contract_number": "CON-004", "account_name": "Angkor University", "account_segment": "Enterprise", "product": "DPLC", "status": "Active", "start_date": "2023-09-01", "end_date": "2027-08-31", "monthly_value": 3600, "sla_availability": 99.90, "sla_mttr_hours": 4, "msa_number": "MSA-ANG-2023-09", "service_schedule_number": "SS-023", "route_diversity": "Dual route", "service_credit_rate": 10},
    {"contract_number": "CON-005", "account_name": "MekongNet Carrier Services", "account_segment": "Carrier", "product": "IP Transit", "status": "Active", "start_date": "2022-07-01", "end_date": "2026-09-30", "monthly_value": 8600, "sla_availability": 99.95, "sla_mttr_hours": 2, "msa_number": "MSA-MNK-2022-07", "service_schedule_number": "SS-031", "route_diversity": "Dual route", "service_credit_rate": 15},
    {"contract_number": "CON-006", "account_name": "Sihanoukville Port Authority", "account_segment": "Government", "product": "Fiber Route Lease", "status": "Active", "start_date": "2025-01-01", "end_date": "2028-12-31", "monthly_value": 4100, "sla_availability": 99.90, "sla_mttr_hours": 6, "msa_number": "MSA-SHV-2025-01", "service_schedule_number": "SS-037", "route_diversity": "Standard", "service_credit_rate": 8},
    {"contract_number": "CON-007", "account_name": "Kampong Cham Provincial Hospital", "account_segment": "Enterprise", "product": "DPLC", "status": "Feasibility", "start_date": "2026-08-01", "end_date": "2029-07-31", "monthly_value": 2900, "sla_availability": 99.90, "sla_mttr_hours": 4, "msa_number": "MSA-KCH-2026-01", "service_schedule_number": "SS-042", "route_diversity": "Pending survey", "service_credit_rate": 10},
    {"contract_number": "CON-008", "account_name": "Khmer Retail Group", "account_segment": "SME", "product": "SIP Trunk", "status": "Expiring", "start_date": "2024-01-01", "end_date": "2026-08-15", "monthly_value": 980, "sla_availability": 99.50, "sla_mttr_hours": 8, "msa_number": "MSA-KRG-2024-01", "service_schedule_number": "SS-048", "route_diversity": "Standard", "service_credit_rate": 5},
])

CIRCUITS.extend([
    {"circuit_id": "CIR-ANGKOR-UNI-01", "contract": "CON-004", "asset": "AST-005", "pop": "POP-SR", "endpoint_a": "Angkor University Main Campus", "endpoint_b": "Siem Reap Exchange", "bandwidth": "1 Gbps", "provisioning_stage": "Active", "status": "Active"},
    {"circuit_id": "CIR-MEKONG-TR-01", "contract": "CON-005", "asset": "AST-001", "pop": "POP-BKK", "endpoint_a": "MekongNet Carrier NOC", "endpoint_b": "Fiberline Transit Gateway", "bandwidth": "10 Gbps", "provisioning_stage": "Active", "status": "Active"},
    {"circuit_id": "CIR-SHV-PORT-01", "contract": "CON-006", "asset": "AST-006", "pop": "POP-SHV", "endpoint_a": "Sihanoukville Port Authority", "endpoint_b": "Sihanoukville Gateway", "bandwidth": "2 Gbps", "provisioning_stage": "Testing", "status": "Planned"},
    {"circuit_id": "CIR-KCMPH-01", "contract": "CON-007", "asset": "AST-007", "pop": "POP-KDL", "endpoint_a": "Kampong Cham Provincial Hospital", "endpoint_b": "Kandal Access POP", "bandwidth": "500 Mbps", "provisioning_stage": "Survey", "status": "Planned"},
    {"circuit_id": "CIR-KHMER-VOICE-01", "contract": "CON-008", "asset": "AST-008", "pop": "POP-WPH", "endpoint_a": "Khmer Retail Group HQ", "endpoint_b": "Wat Phnom Voice Core", "bandwidth": "60 voice channels", "provisioning_stage": "Active", "status": "Active"},
])

TICKETS.extend([
    {"id": "TCK-2401", "customer": "MekongNet Carrier Services", "text": "Transit route packet loss above the contracted threshold", "opened_on": "2026-07-19", "ticket_class": "Wholesale", "priority": "Critical", "contract": "CON-005", "circuit": "CIR-MEKONG-TR-01", "sla_due_at": "2026-07-21T02:00:00+00:00"},
    {"id": "TCK-2402", "customer": "Khmer Retail Group", "text": "SIP trunk call quality degradation during peak hours", "opened_on": "2026-07-18", "ticket_class": "Business", "priority": "High", "contract": "CON-008", "circuit": "CIR-KHMER-VOICE-01", "sla_due_at": "2026-07-21T08:30:00+00:00"},
    {"id": "TCK-2403", "customer": "Kampong Cham Provincial Hospital", "text": "Site survey access approval pending with provincial administration", "opened_on": "2026-07-17", "ticket_class": "Enterprise", "priority": "Medium", "contract": "CON-007", "circuit": "CIR-KCMPH-01", "sla_due_at": "2026-07-23T10:00:00+00:00"},
    {"id": "TCK-2404", "customer": "Lotus Residence", "text": "ONT replacement requested after power surge", "opened_on": "2026-07-18", "ticket_class": "Retail", "priority": "Low", "sla_due_at": "2026-07-22T09:00:00+00:00"},
])

INVOICES.extend([
    {"id": "INV-2026-013", "customer": "Phnom Penh Digital Co.", "amount": 120, "status": "paid", "issued": "2026-07-01", "due": "2026-07-15", "paid": "2026-07-09"},
    {"id": "INV-2026-014", "customer": "MekongNet Carrier Services", "amount": 8600, "status": "pending", "issued": "2026-07-01", "due": "2026-07-25", "paid": None},
    {"id": "INV-2026-015", "customer": "Sihanoukville Port Authority", "amount": 4100, "status": "paid", "issued": "2026-07-01", "due": "2026-07-20", "paid": "2026-07-13"},
    {"id": "INV-2026-016", "customer": "Angkor University", "amount": 3600, "status": "paid", "issued": "2026-07-01", "due": "2026-07-18", "paid": "2026-07-16"},
    {"id": "INV-2026-017", "customer": "Khmer Retail Group", "amount": 980, "status": "overdue", "issued": "2026-06-01", "due": "2026-06-20", "paid": None},
    {"id": "INV-2026-018", "customer": "Lotus Residence", "amount": 45, "status": "paid", "issued": "2026-07-01", "due": "2026-07-15", "paid": "2026-07-06"},
])

QUOTES.extend([
    {"quote_number": "QTE-003", "account": "Phnom Penh Digital Co.", "product": "PRD-SIP-TRUNK", "status": "Approved", "feasibility_status": "Not required", "requested_capacity": "30 channels", "route_distance_km": None, "term_months": 24, "monthly_value": 150, "notes": "Expansion of the existing business voice service."},
    {"quote_number": "QTE-004", "account": "MekongNet Carrier Services", "product": "PRD-IP-TRANSIT", "status": "Submitted", "feasibility_status": "Approved", "requested_capacity": "20 Gbps", "route_distance_km": 8.4, "term_months": 36, "monthly_value": 12400, "notes": "Diverse route and committed burst capacity required."},
    {"quote_number": "QTE-005", "account": "Angkor University", "product": "PRD-DPLC", "status": "Approved", "feasibility_status": "Approved", "requested_capacity": "1 Gbps", "route_distance_km": 5.2, "term_months": 48, "monthly_value": 3600, "notes": "Campus-to-exchange dual-route DPLC."},
    {"quote_number": "QTE-006", "account": "Sihanoukville Port Authority", "product": "PRD-FIBER-LEASE", "status": "Submitted", "feasibility_status": "Pending", "requested_capacity": "2 Gbps", "route_distance_km": 3.8, "term_months": 48, "monthly_value": 4100, "notes": "Port access expansion subject to civil permit."},
    {"quote_number": "QTE-007", "account": "Lotus Residence", "product": "PRD-HOME-300", "status": "Approved", "feasibility_status": "Not required", "requested_capacity": "300 Mbps", "route_distance_km": None, "term_months": 12, "monthly_value": 45, "notes": "Residential fiber activation."},
    {"quote_number": "QTE-008", "account": "Khmer Retail Group", "product": "PRD-VPBX", "status": "Draft", "feasibility_status": "Not required", "requested_capacity": "80 seats", "route_distance_km": None, "term_months": 24, "monthly_value": 450, "notes": "Branch voice consolidation proposal."},
])

ACTIVITIES.extend([
    {"time_label": "10:15", "html": "<b>MekongNet Carrier Services</b> transit incident escalated to the NOC"},
    {"time_label": "09:48", "html": "<b>Angkor University</b> DPLC circuit activated on the Siem Reap fiber ring"},
    {"time_label": "09:10", "html": "<b>Khmer Retail Group</b> invoice moved into the collections workflow"},
    {"time_label": "08:36", "html": "<b>Sihanoukville Gateway</b> capacity reservation created for port expansion"},
])

# Kampot demonstration data. These records model a planned rollout and are not live network inventory.
POPS.extend([
    {"code": "POP-KPT", "name": "Kampot Demo POP", "latitude": 10.6082, "longitude": 104.1805, "ports_total": 48, "ports_used": 16, "switch_id": "SW-CORE-KPT-DEMO"},
])

SITES.extend([
    {"code": "SITE-KPT-01", "name": "Kampot Seaside Hotel Demo Site", "latitude": 10.6074, "longitude": 104.1794},
    {"code": "SITE-KPT-02", "name": "Kampot Pepper Cooperative Demo Site", "latitude": 10.6102, "longitude": 104.1988},
])

ASSETS.extend([
    {"code": "AST-KPT-01", "name": "Kampot Demo Fiber Ring", "asset_type": "Fiber Route", "location_name": "Kampot city center", "latitude": 10.6082, "longitude": 104.1805, "capacity_total": 96, "capacity_used": 12, "capacity_unit": "fiber cores", "status": "Planned"},
    {"code": "AST-KPT-02", "name": "Kampot Demo Riverside Duct", "asset_type": "Cable Duct", "location_name": "Kampot riverside access", "latitude": 10.6031, "longitude": 104.1808, "capacity_total": 24, "capacity_used": 4, "capacity_unit": "duct slots", "status": "Planned"},
    {"code": "AST-KPT-03", "name": "Kampot Demo Access Tower", "asset_type": "Tower Space", "location_name": "Kampot outer service zone", "latitude": 10.6185, "longitude": 104.1988, "capacity_total": 6, "capacity_used": 1, "capacity_unit": "antenna slots", "status": "Planned"},
])

CUSTOMERS.extend([
    {"name": "Kampot Seaside Hotel Demo", "site": "SITE-KPT-01", "pop": "POP-KPT", "plan": "DPLC", "account_type": "Enterprise", "verification_status": "KYB Verified", "billing_model": "Recurring", "status": "Onboarding", "risk": "Medium", "monthly_value": 2200, "tenure": "New", "port": "GE0/3/09", "reasons": ["Demo candidate route requires a field survey"]},
    {"name": "Kampot Pepper Cooperative Demo", "site": "SITE-KPT-02", "pop": "POP-KPT", "plan": "TC-Biz Fiber 500", "account_type": "SME", "verification_status": "Pending", "billing_model": "Recurring", "status": "Onboarding", "risk": "Low", "monthly_value": 120, "tenure": "New", "port": "GE0/3/12", "reasons": ["Demo outer coverage zone requires a survey"]},
])

CONTRACTS.extend([
    {"contract_number": "CON-KPT-001", "account_name": "Kampot Seaside Hotel Demo", "account_segment": "Enterprise", "product": "DPLC", "status": "Feasibility", "start_date": "2026-08-01", "end_date": "2029-07-31", "monthly_value": 2200, "sla_availability": 99.90, "sla_mttr_hours": 4, "msa_number": "MSA-KPT-DEMO-01", "service_schedule_number": "SS-KPT-001", "route_diversity": "Pending survey", "service_credit_rate": 10},
])

CIRCUITS.extend([
    {"circuit_id": "CIR-KPT-DEMO-01", "contract": "CON-KPT-001", "asset": "AST-KPT-01", "pop": "POP-KPT", "endpoint_a": "Kampot Seaside Hotel Demo Site", "endpoint_b": "Kampot Demo POP", "bandwidth": "100 Mbps", "provisioning_stage": "Survey", "status": "Planned"},
])

TICKETS.extend([
    {"id": "TCK-KPT-001", "customer": "Kampot Seaside Hotel Demo", "text": "Demo field survey required to validate the candidate Kampot City Ring corridor", "opened_on": "2026-07-20", "ticket_class": "Enterprise", "priority": "Medium", "contract": "CON-KPT-001", "circuit": "CIR-KPT-DEMO-01", "sla_due_at": "2026-07-24T09:00:00+00:00"},
])

INVOICES.extend([
    {"id": "INV-KPT-001", "customer": "Kampot Seaside Hotel Demo", "amount": 2200, "status": "pending", "issued": "2026-07-01", "due": "2026-07-31", "paid": None},
    {"id": "INV-KPT-002", "customer": "Kampot Pepper Cooperative Demo", "amount": 120, "status": "pending", "issued": "2026-07-01", "due": "2026-07-31", "paid": None},
])

QUOTES.extend([
    {"quote_number": "QTE-KPT-001", "account": "Kampot Seaside Hotel Demo", "product": "PRD-DPLC", "status": "Submitted", "feasibility_status": "Pending", "requested_capacity": "100 Mbps", "route_distance_km": 0.3, "term_months": 36, "monthly_value": 2200, "notes": "Demo quote pending a Kampot candidate-route field survey."},
    {"quote_number": "QTE-KPT-002", "account": "Kampot Pepper Cooperative Demo", "product": "PRD-BIZ-500", "status": "Draft", "feasibility_status": "Not required", "requested_capacity": "500 Mbps", "route_distance_km": None, "term_months": 12, "monthly_value": 120, "notes": "Demo business fiber quote for the Kampot outer zone."},
])

ACTIVITIES.extend([
    {"time_label": "Demo", "html": "<b>Kampot Demo POP</b> added with planned fiber, duct, and tower assets"},
    {"time_label": "Demo", "html": "<b>Kampot Seaside Hotel Demo</b> moved into the route feasibility survey queue"},
])


def seed() -> None:
    with SessionLocal() as session:
        for pop in POPS:
            if session.scalar(select(Pop.id).where(Pop.code == pop["code"])) is None:
                session.add(Pop(**pop))
        for site in SITES:
            if session.scalar(select(CustomerSite.id).where(CustomerSite.code == site["code"])) is None:
                session.add(CustomerSite(**site))
        for asset in ASSETS:
            if session.scalar(select(InfrastructureAsset.id).where(InfrastructureAsset.code == asset["code"])) is None:
                session.add(InfrastructureAsset(**asset))
        for product in PRODUCTS:
            if session.scalar(select(ProductOffering.id).where(ProductOffering.code == product["code"])) is None:
                session.add(ProductOffering(**product))
        session.flush()

        pop_by_code = {pop.code: pop.id for pop in session.scalars(select(Pop)).all()}
        site_by_code = {site.code: site.id for site in session.scalars(select(CustomerSite)).all()}
        customer_by_name = {customer.name: customer.id for customer in session.scalars(select(Customer)).all()}
        for customer in CUSTOMERS:
            if customer["name"] not in customer_by_name:
                session.add(
                    Customer(
                        name=customer["name"],
                        site_id=site_by_code[customer["site"]],
                        pop_id=pop_by_code[customer["pop"]],
                        plan=customer["plan"],
                        account_type=customer["account_type"],
                        verification_status=customer["verification_status"],
                        billing_model=customer.get("billing_model", "Recurring"),
                        status=customer["status"],
                        risk=customer["risk"],
                        monthly_value=customer["monthly_value"],
                        tenure=customer["tenure"],
                        port=customer["port"],
                        reasons=customer["reasons"],
                    )
                )
        session.flush()

        customer_by_name = {customer.name: customer.id for customer in session.scalars(select(Customer)).all()}
        for contract in CONTRACTS:
            if session.scalar(select(ServiceContract.id).where(ServiceContract.contract_number == contract["contract_number"])) is None:
                session.add(
                    ServiceContract(
                        contract_number=contract["contract_number"],
                        account_name=contract["account_name"],
                        account_segment=contract["account_segment"],
                        product=contract["product"],
                        status=contract["status"],
                        start_date=date.fromisoformat(contract["start_date"]),
                        end_date=date.fromisoformat(contract["end_date"]),
                        monthly_value=contract["monthly_value"],
                        sla_availability=contract["sla_availability"],
                        sla_mttr_hours=contract["sla_mttr_hours"],
                        msa_number=contract["msa_number"],
                        service_schedule_number=contract["service_schedule_number"],
                        route_diversity=contract["route_diversity"],
                        service_credit_rate=contract["service_credit_rate"],
                    )
                )
        session.flush()

        contract_by_number = {contract.contract_number: contract.id for contract in session.scalars(select(ServiceContract)).all()}
        asset_by_code = {asset.code: asset.id for asset in session.scalars(select(InfrastructureAsset)).all()}
        for circuit in CIRCUITS:
            if session.scalar(select(Circuit.id).where(Circuit.circuit_id == circuit["circuit_id"])) is None:
                session.add(
                    Circuit(
                        circuit_id=circuit["circuit_id"],
                        contract_id=contract_by_number[circuit["contract"]],
                        asset_id=asset_by_code[circuit["asset"]],
                        pop_id=pop_by_code[circuit["pop"]],
                        endpoint_a=circuit["endpoint_a"],
                        endpoint_b=circuit["endpoint_b"],
                        bandwidth=circuit["bandwidth"],
                        provisioning_stage=circuit["provisioning_stage"],
                        status=circuit["status"],
                    )
                )
        session.flush()

        circuit_by_code = {circuit.circuit_id: circuit.id for circuit in session.scalars(select(Circuit)).all()}
        for ticket in TICKETS:
            if session.get(Ticket, ticket["id"]) is None:
                session.add(
                    Ticket(
                        id=ticket["id"],
                        customer_id=customer_by_name[ticket["customer"]],
                        text=ticket["text"],
                        opened_on=date.fromisoformat(ticket["opened_on"]),
                        ticket_class=ticket.get("ticket_class", "Retail"),
                        priority=ticket.get("priority", "Normal"),
                        contract_id=contract_by_number.get(ticket.get("contract")),
                        circuit_id=circuit_by_code.get(ticket.get("circuit")),
                        sla_due_at=datetime.fromisoformat(ticket["sla_due_at"]) if ticket.get("sla_due_at") else None,
                    )
                )
        for invoice in INVOICES:
            if session.get(Invoice, invoice["id"]) is None:
                session.add(
                    Invoice(
                        id=invoice["id"],
                        customer_id=customer_by_name[invoice["customer"]],
                        amount=invoice["amount"],
                        status=invoice["status"],
                        issued=date.fromisoformat(invoice["issued"]),
                        due=date.fromisoformat(invoice["due"]),
                        paid=date.fromisoformat(invoice["paid"]) if invoice["paid"] else None,
                    )
                )
        for activity in ACTIVITIES:
            if session.scalar(select(Activity.id).where(Activity.html == activity["html"])) is None:
                session.add(Activity(**activity))
        session.flush()

        product_by_code = {product.code: product.id for product in session.scalars(select(ProductOffering)).all()}
        for quote in QUOTES:
            if session.scalar(select(Quote.id).where(Quote.quote_number == quote["quote_number"])) is None:
                session.add(
                    Quote(
                        quote_number=quote["quote_number"],
                        account_id=customer_by_name[quote["account"]],
                        product_id=product_by_code[quote["product"]],
                        status=quote["status"],
                        feasibility_status=quote["feasibility_status"],
                        requested_capacity=quote["requested_capacity"],
                        route_distance_km=quote["route_distance_km"],
                        term_months=quote["term_months"],
                        monthly_value=quote["monthly_value"],
                        notes=quote["notes"],
                    )
                )
        session.commit()


if __name__ == "__main__":
    seed()
