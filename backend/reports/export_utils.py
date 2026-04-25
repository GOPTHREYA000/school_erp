import os
import openpyxl
from openpyxl.styles import Font, PatternFill
from django.conf import settings
import uuid

def generate_excel_file(report_type, headers, data_rows):
    """
    Generates an Excel file and saves it to the media reports directory.
    Returns the relative URL of the saved file.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = str(report_type).title().replace('_', ' ')[:31]

    # Styling for header
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")

    # Write headers
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.font = header_font
        cell.fill = header_fill

    # Write data
    for row_num, row_data in enumerate(data_rows, 2):
        for col_num, cell_value in enumerate(row_data, 1):
            ws.cell(row=row_num, column=col_num, value=cell_value)

    # Adjust auto-width
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter # Get the column name
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width

    # Prepare file directory
    reports_dir = os.path.join(settings.BASE_DIR, 'media', 'exports')
    os.makedirs(reports_dir, exist_ok=True)
    
    file_name = f"{report_type}_{uuid.uuid4().hex[:8]}.xlsx"
    file_path = os.path.join(reports_dir, file_name)
    
    wb.save(file_path)
    
    # Return relative URL
    return f"/media/exports/{file_name}"
