import csv
import io

def get_val(row, *keys):
    for k in keys:
        if k in row and row[k]: return row[k]
        for rk in row.keys():
            if k in rk and row[rk]: return row[rk]
    return ''

csv_data = """Admission No,Student Name,Class,Section,Category,Parent Name,Parent Mobile,Tuition Fee,Transport Fee,Past Due,Total Amount (₹),Total Amount (%),Concession (₹),Concession (%),Amount Paid (₹),Amount Paid (%),Balance (₹),Balance (%),Status,Inactive Reason
KGS-GSP-023,PORANDLA  SREEYANSH,Nursery,Sec A,Day Scholar,PORANDLA RAVIKUMAR PORANDLA,9000993404,"28,000.00",0.00,0.00,"28,000.00",100%,"20,000.00",71.43%,"8,000.00",28.57%,0.00,0.00%,Active,
"""
reader = csv.DictReader(io.StringIO(csv_data))
reader.fieldnames = [h.strip().lower() for h in reader.fieldnames]
for row in reader:
    print("KEYS:", list(row.keys()))
    row = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items() if k}
    print("FN:", get_val(row, 'first_name', 'student name'))
    print("Total Amount:", get_val(row, 'total_fee', 'total amount (₹)'))
