import { createElement, forwardRef, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The icons this app uses, inlined so dev mode doesn't pre-bundle a
 * 1,900-icon library. Path data is from Lucide (https://lucide.dev), ISC
 * License, Copyright (c) Lucide Contributors.
 *
 * To add an icon: find it on lucide.dev, copy the child elements of its SVG
 * into a new `icon("name", [...])` line, and keep this list sorted.
 */

type IconNode = [tag: string, attrs: Record<string, string>][];

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string };
export type IconComponent = ReturnType<typeof icon>;

function icon(name: string, nodes: IconNode) {
  const Component = forwardRef<SVGSVGElement, IconProps>(({ size = 24, strokeWidth = 2, className, children, ...props }, ref) =>
    createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: cn("lucide", `lucide-${name}`, className),
        ...(props["aria-label"] || props.role ? {} : { "aria-hidden": true }),
        ...props,
      },
      ...nodes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
      children,
    ),
  );
  Component.displayName = name;
  return Component;
}

export const AlertTriangle = icon("triangle-alert", [["path",{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{"d":"M12 9v4"}],["path",{"d":"M12 17h.01"}]]);
export const ArrowRight = icon("arrow-right", [["path",{"d":"M5 12h14"}],["path",{"d":"m12 5 7 7-7 7"}]]);
export const Building2 = icon("building-2", [["path",{"d":"M10 12h4"}],["path",{"d":"M10 8h4"}],["path",{"d":"M14 21v-3a2 2 0 0 0-4 0v3"}],["path",{"d":"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}],["path",{"d":"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"}]]);
export const CalendarClock = icon("calendar-clock", [["path",{"d":"M16 14v2.2l1.6 1"}],["path",{"d":"M16 2v4"}],["path",{"d":"M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"}],["path",{"d":"M3 10h5"}],["path",{"d":"M8 2v4"}],["circle",{"cx":"16","cy":"16","r":"6"}]]);
export const CalendarDays = icon("calendar-days", [["path",{"d":"M8 2v4"}],["path",{"d":"M16 2v4"}],["rect",{"width":"18","height":"18","x":"3","y":"4","rx":"2"}],["path",{"d":"M3 10h18"}],["path",{"d":"M8 14h.01"}],["path",{"d":"M12 14h.01"}],["path",{"d":"M16 14h.01"}],["path",{"d":"M8 18h.01"}],["path",{"d":"M12 18h.01"}],["path",{"d":"M16 18h.01"}]]);
export const Check = icon("check", [["path",{"d":"M20 6 9 17l-5-5"}]]);
export const CheckCircle2 = icon("circle-check", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m9 12 2 2 4-4"}]]);
export const CheckSquare = icon("square-check-big", [["path",{"d":"M21 10.656V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.344"}],["path",{"d":"m9 11 3 3L22 4"}]]);
export const ChevronDown = icon("chevron-down", [["path",{"d":"m6 9 6 6 6-6"}]]);
export const ChevronLeft = icon("chevron-left", [["path",{"d":"m15 18-6-6 6-6"}]]);
export const ChevronRight = icon("chevron-right", [["path",{"d":"m9 18 6-6-6-6"}]]);
export const ChevronUp = icon("chevron-up", [["path",{"d":"m18 15-6-6-6 6"}]]);
export const ChevronsUpDown = icon("chevrons-up-down", [["path",{"d":"m7 15 5 5 5-5"}],["path",{"d":"m7 9 5-5 5 5"}]]);
export const Circle = icon("circle", [["circle",{"cx":"12","cy":"12","r":"10"}]]);
export const Compass = icon("compass", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"}]]);
export const Database = icon("database", [["ellipse",{"cx":"12","cy":"5","rx":"9","ry":"3"}],["path",{"d":"M3 5V19A9 3 0 0 0 21 19V5"}],["path",{"d":"M3 12A9 3 0 0 0 21 12"}]]);
export const DatabaseZap = icon("database-zap", [["ellipse",{"cx":"12","cy":"5","rx":"9","ry":"3"}],["path",{"d":"M3 5V19A9 3 0 0 0 15 21.84"}],["path",{"d":"M21 5V8"}],["path",{"d":"M21 12L18 17H22L19 22"}],["path",{"d":"M3 12A9 3 0 0 0 14.59 14.87"}]]);
export const Globe = icon("globe", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}],["path",{"d":"M2 12h20"}]]);
export const Handshake = icon("handshake", [["path",{"d":"m11 17 2 2a1 1 0 1 0 3-3"}],["path",{"d":"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"}],["path",{"d":"m21 3 1 11h-2"}],["path",{"d":"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"}],["path",{"d":"M3 4h8"}]]);
export const Kanban = icon("kanban", [["path",{"d":"M5 3v14"}],["path",{"d":"M12 3v8"}],["path",{"d":"M19 3v18"}]]);
export const LayoutDashboard = icon("layout-dashboard", [["rect",{"width":"7","height":"9","x":"3","y":"3","rx":"1"}],["rect",{"width":"7","height":"5","x":"14","y":"3","rx":"1"}],["rect",{"width":"7","height":"9","x":"14","y":"12","rx":"1"}],["rect",{"width":"7","height":"5","x":"3","y":"16","rx":"1"}]]);
export const List = icon("list", [["path",{"d":"M3 5h.01"}],["path",{"d":"M3 12h.01"}],["path",{"d":"M3 19h.01"}],["path",{"d":"M8 5h13"}],["path",{"d":"M8 12h13"}],["path",{"d":"M8 19h13"}]]);
export const ListTodo = icon("list-todo", [["path",{"d":"M13 5h8"}],["path",{"d":"M13 12h8"}],["path",{"d":"M13 19h8"}],["path",{"d":"m3 17 2 2 4-4"}],["rect",{"x":"3","y":"4","width":"6","height":"6","rx":"1"}]]);
export const Loader2Icon = icon("loader-circle", [["path",{"d":"M21 12a9 9 0 1 1-6.219-8.56"}]]);
export const LogOut = icon("log-out", [["path",{"d":"m16 17 5-5-5-5"}],["path",{"d":"M21 12H9"}],["path",{"d":"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}]]);
export const Mail = icon("mail", [["path",{"d":"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"}],["rect",{"x":"2","y":"4","width":"20","height":"16","rx":"2"}]]);
export const Menu = icon("menu", [["path",{"d":"M4 5h16"}],["path",{"d":"M4 12h16"}],["path",{"d":"M4 19h16"}]]);
export const MessageSquareText = icon("message-square-text", [["path",{"d":"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"}],["path",{"d":"M7 11h10"}],["path",{"d":"M7 15h6"}],["path",{"d":"M7 7h8"}]]);
export const Moon = icon("moon", [["path",{"d":"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"}]]);
export const MoreHorizontal = icon("ellipsis", [["circle",{"cx":"12","cy":"12","r":"1"}],["circle",{"cx":"19","cy":"12","r":"1"}],["circle",{"cx":"5","cy":"12","r":"1"}]]);
export const Pencil = icon("pencil", [["path",{"d":"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"}],["path",{"d":"m15 5 4 4"}]]);
export const Phone = icon("phone", [["path",{"d":"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"}]]);
export const Plus = icon("plus", [["path",{"d":"M5 12h14"}],["path",{"d":"M12 5v14"}]]);
export const Search = icon("search", [["path",{"d":"m21 21-4.34-4.34"}],["circle",{"cx":"11","cy":"11","r":"8"}]]);
export const SearchX = icon("search-x", [["path",{"d":"m13.5 8.5-5 5"}],["path",{"d":"m8.5 8.5 5 5"}],["circle",{"cx":"11","cy":"11","r":"8"}],["path",{"d":"m21 21-4.3-4.3"}]]);
export const Settings = icon("settings", [["path",{"d":"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"}],["circle",{"cx":"12","cy":"12","r":"3"}]]);
export const Sun = icon("sun", [["circle",{"cx":"12","cy":"12","r":"4"}],["path",{"d":"M12 2v2"}],["path",{"d":"M12 20v2"}],["path",{"d":"m4.93 4.93 1.41 1.41"}],["path",{"d":"m17.66 17.66 1.41 1.41"}],["path",{"d":"M2 12h2"}],["path",{"d":"M20 12h2"}],["path",{"d":"m6.34 17.66-1.41 1.41"}],["path",{"d":"m19.07 4.93-1.41 1.41"}]]);
export const Trash2 = icon("trash-2", [["path",{"d":"M10 11v6"}],["path",{"d":"M14 11v6"}],["path",{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}],["path",{"d":"M3 6h18"}],["path",{"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]]);
export const Trophy = icon("trophy", [["path",{"d":"M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"}],["path",{"d":"M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"}],["path",{"d":"M18 9h1.5a1 1 0 0 0 0-5H18"}],["path",{"d":"M4 22h16"}],["path",{"d":"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"}],["path",{"d":"M6 9H4.5a1 1 0 0 1 0-5H6"}]]);
export const Users = icon("users", [["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["path",{"d":"M16 3.128a4 4 0 0 1 0 7.744"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["circle",{"cx":"9","cy":"7","r":"4"}]]);
export const X = icon("x", [["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]]);
export const XCircle = icon("circle-x", [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m15 9-6 6"}],["path",{"d":"m9 9 6 6"}]]);
