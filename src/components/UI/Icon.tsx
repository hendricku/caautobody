"use client";

import type { CSSProperties } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import CarRepairRounded from "@mui/icons-material/CarRepairRounded";
import ChevronDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DirectionsCarFilledRounded from "@mui/icons-material/DirectionsCarFilledRounded";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import Facebook from "@mui/icons-material/Facebook";
import GarageOutlined from "@mui/icons-material/GarageOutlined";
import Instagram from "@mui/icons-material/Instagram";
import LinkRounded from "@mui/icons-material/LinkRounded";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PhoneRounded from "@mui/icons-material/PhoneRounded";
import ShareOutlined from "@mui/icons-material/ShareOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

const icons = {
  add: AddRounded,
  "arrow-back": ArrowBackRounded,
  "arrow-down": ArrowDownwardRounded,
  "arrow-forward": ArrowForwardRounded,
  "arrow-outward": ArrowOutwardRounded,
  "arrow-up": ArrowUpwardRounded,
  "car-filled": DirectionsCarFilledRounded,
  "car-repair": CarRepairRounded,
  "chevron-down": ChevronDownRounded,
  "chevron-left": ChevronLeftRounded,
  "chevron-right": ChevronRightRounded,
  close: CloseRounded,
  copy: ContentCopyOutlined,
  "directions-car": DirectionsCarOutlined,
  delete: DeleteOutlineRounded,
  edit: EditOutlined,
  facebook: Facebook,
  "expand-less": ExpandLessRounded,
  "expand-more": ExpandMoreRounded,
  garage: GarageOutlined,
  instagram: Instagram,
  link: LinkRounded,
  "location-filled": LocationOnRounded,
  location: LocationOnOutlined,
  menu: MenuRounded,
  phone: PhoneRounded,
  share: ShareOutlined,
  upload: UploadFileOutlined,
} as const;

export type IconName = keyof typeof icons;

export default function Icon({ name, className, style }: { name: IconName; className?: string; style?: CSSProperties }) {
  const Component = icons[name];
  return <Component aria-hidden="true" focusable="false" className={className} style={style} fontSize="inherit" />;
}
