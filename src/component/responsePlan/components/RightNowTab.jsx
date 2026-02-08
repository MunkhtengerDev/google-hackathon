import React from "react";
import { Zap } from "lucide-react";
import { Card, SectionHeader } from "../../../ui/primitives";
import RightNowLiveAssistant from "../RightNowLiveAssistant";

export default function RightNowTab({ token, user, rightNowContext }) {
  return (
    <Card>
      <SectionHeader
        icon={<Zap className="h-5 w-5" />}
        title="Right Now"
        subtitle="Send your live context to AI: location, prompt, image, and camera capture."
      />
      <RightNowLiveAssistant
        token={token}
        user={user}
        rightNowContext={rightNowContext}
      />
    </Card>
  );
}
