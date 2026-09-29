import { CalendarClock, CheckSquare, Mail, MessageSquareText, Phone, type IconComponent } from "@/components/icons";

export const activityIcons: Record<string, IconComponent> = {
  note: MessageSquareText,
  call: Phone,
  email: Mail,
  meeting: CalendarClock,
  task: CheckSquare,
};
