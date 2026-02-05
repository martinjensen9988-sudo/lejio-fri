import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

export function PageBuilderButton() {
  const navigate = useNavigate();
  
  return (
    <Button 
      onClick={() => navigate("/dashboard/pages")}
      variant="default"
      className="gap-2"
    >
      <FileText className="w-4 h-4" />
      PageBuilder
    </Button>
  );
}
