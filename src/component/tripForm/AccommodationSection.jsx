import React from "react";
import { Bed, Map } from "lucide-react";
import { Card, SectionHeader, PillButton } from "../../ui/primitives";

export default function AccommodationSection({ value, onChange }) {
  return (
    <Card>
      <SectionHeader
        icon={<Bed className="w-5 h-5" />}
        title="Accommodation"
        subtitle="Where will you be staying?"
      />

      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Status</div>
        <div className="flex gap-2">
          <PillButton active={value.status === "booked"} onClick={() => onChange({...value, status: "booked"})}>Already Booked</PillButton>
          <PillButton active={value.status === "not_booked"} onClick={() => onChange({...value, status: "not_booked"})}>Not Booked Yet</PillButton>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Type</div>
        <div className="flex flex-wrap gap-2">
           {["Hotel", "Airbnb/Apt", "Hostel", "Friends"].map(t => (
             <PillButton key={t} active={value.type === t.toLowerCase()} onClick={() => onChange({...value, type: t.toLowerCase()})}>{t}</PillButton>
           ))}
        </div>
      </div>
      
      <div>
        <div className="text-sm font-semibold mb-2">Location Preference</div>
        <div className="flex flex-wrap gap-2">
           {["Central", "Quiet", "Near Transit", "Nature"].map(l => (
             <PillButton key={l} active={value.locationPref === l.toLowerCase()} onClick={() => onChange({...value, locationPref: l.toLowerCase()})}>{l}</PillButton>
           ))}
        </div>
      </div>
    </Card>
  );
}