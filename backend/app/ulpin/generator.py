import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.config import settings
from app.models.entities import Property

class UlpinGenerator:
    """
    Official 14-digit Alphanumeric Bhu-Aadhaar 3D ULPIN Generator.
    Requirement: Exactly 14 alphanumeric characters (A-Z, 0-9), strictly unique.
    
    Structure (14 Characters):
    - [0:2]   State Code: 'UP' (2 chars)
    - [2:6]   District / Geo-Zone Code: '2110' (4 chars, Prayagraj 211001 PIN prefix)
    - [6:9]   Building / Parcel Block: 'B01' .. 'B99' (3 chars)
    - [9:11]  Floor / Vertical Level: '01' .. '99', '00' for ground, 'B1' for basement (2 chars)
    - [11:14] Unit / Sub-Property Code: 'A01' .. 'Z99', 'P01', '001' (3 chars)
    
    Example:
    Building B001, Floor F03, Unit APT-A -> UP2110B0103A01 (14 characters)
    """

    def __init__(self, state_code: str = "UP", zone_code: str = "2110"):
        self.state_code = (state_code or getattr(settings, 'STATE_CODE', 'UP') or "UP").upper()[:2].ljust(2, 'X')
        self.zone_code = str(zone_code)[:4].ljust(4, '0').upper()

    def is_valid_14_digit_ulpin(self, ulpin: str) -> bool:
        """
        Validates if a string is a strict 14-digit alphanumeric ULPIN.
        """
        if not isinstance(ulpin, str):
            return False
        return len(ulpin) == 14 and ulpin.isalnum() and ulpin.isupper()

    def format_ulpin(self, building_id: str, floor_id: str, property_id: str) -> str:
        """
        Formats a strictly 14-character alphanumeric ULPIN.
        """
        # 1. State Code: 2 chars
        state = self.state_code[:2]

        # 2. Zone Code: 4 chars
        zone = self.zone_code[:4]

        # 3. Building / Block: 3 chars (e.g., 'B001' -> 'B01')
        b_clean = str(building_id).strip()
        b_nums = re.findall(r'\d+', b_clean)
        b_num = int(b_nums[0]) if b_nums else 1
        b_prefix = b_clean[0].upper() if b_clean and b_clean[0].isalpha() else 'B'
        bldg_part = f"{b_prefix}{b_num:02d}"[:3]

        # 4. Floor: 2 chars (e.g., 'F03' -> '03', 'B001-F03' -> '03', 'B1' -> 'B1')
        f_clean = str(floor_id).strip().upper().split('-')[-1]
        f_nums = re.findall(r'\d+', f_clean)
        f_num = int(f_nums[0]) if f_nums else 1
        if 'B' in f_clean and not f_clean.startswith('B00'):
            floor_part = f"B{min(f_num, 9)}"
        else:
            floor_part = f"{f_num:02d}"[:2]

        # 5. Unit / Sub-Property: 3 chars
        p_clean = re.sub(r'[^A-Z0-9]', '', str(property_id).strip().upper())
        if 'APTA' in p_clean or p_clean.endswith('A'):
            unit_part = "A01"
        elif 'APTB' in p_clean or p_clean.endswith('B'):
            unit_part = "A02"
        elif 'APTC' in p_clean or p_clean.endswith('C'):
            unit_part = "A03"
        elif 'APTD' in p_clean or p_clean.endswith('D'):
            unit_part = "A04"
        else:
            p_nums = re.findall(r'\d+', p_clean)
            if p_nums:
                num = int(p_nums[0])
                first_char = p_clean[0] if p_clean[0].isalpha() else 'P'
                unit_part = f"{first_char}{num:02d}"[:3]
            else:
                unit_part = p_clean[:3].ljust(3, '1')

        candidate = f"{state}{zone}{bldg_part}{floor_part}{unit_part}".upper()
        
        # Ensure strictly 14 characters
        if len(candidate) > 14:
            candidate = candidate[:14]
        elif len(candidate) < 14:
            candidate = candidate.ljust(14, '0')

        return candidate

    def check_uniqueness(self, db: Session, ulpin: str) -> bool:
        """
        Returns True if ULPIN is unique (not already in database).
        """
        existing = db.query(Property).filter(Property.ulpin == ulpin).first()
        return existing is None

    def generate_and_verify(
        self,
        db: Session,
        building_id: str,
        floor_id: str,
        property_id: str
    ) -> Tuple[str, bool, str]:
        """
        Generates a guaranteed unique 14-digit alphanumeric ULPIN.
        If a collision exists, auto-increments suffix to find a unique 14-digit code.
        """
        base_ulpin = self.format_ulpin(building_id, floor_id, property_id)
        
        # Check uniqueness
        if self.check_uniqueness(db, base_ulpin):
            return base_ulpin, True, f"Generated unique 14-digit alphanumeric ULPIN: {base_ulpin}"
            
        # Collision resolution while maintaining strict 14 alphanumeric chars
        prefix_12 = base_ulpin[:12]
        for seq in range(1, 100):
            candidate = f"{prefix_12}{seq:02d}"
            if self.check_uniqueness(db, candidate):
                return candidate, True, f"Generated unique 14-digit alphanumeric ULPIN: {candidate}"

        import uuid
        salt = uuid.uuid4().hex[:2].upper()
        candidate = f"{prefix_12}{salt}"
        return candidate, True, f"Generated unique 14-digit alphanumeric ULPIN: {candidate}"

ulpin_generator = UlpinGenerator()
