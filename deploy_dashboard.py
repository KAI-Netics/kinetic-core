#!/usr/bin/env python3
"""
Run this once to deploy DASHBOARD.html to C:\Kinetic_Core\
Place this script in the same folder as DASHBOARD.html (outputs folder)
or edit the paths below.
"""
import shutil, os

src = os.path.join(os.path.dirname(__file__), 'DASHBOARD.html')
dst = r'C:\Kinetic_Core\DASHBOARD.html'
backup = r'C:\Kinetic_Core\DASHBOARD_pre_dossier.html'

if not os.path.exists(backup):
    shutil.copy2(dst, backup)
    print(f"Backup created: {backup}")

shutil.copy2(src, dst)
print(f"Deployed: {dst}")
print(f"Size: {os.path.getsize(dst):,} bytes")
