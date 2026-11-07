import { AREAS } from "@/lib/areas";
import type { AreaId } from "@/lib/types";

export function AreaTag({ area }: { area: AreaId }) {
  return (
    <span className="area-tag" style={{ ["--dot" as string]: AREAS[area].dot }}>
      {AREAS[area].label}
    </span>
  );
}
