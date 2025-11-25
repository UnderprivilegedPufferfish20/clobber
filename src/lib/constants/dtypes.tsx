import { CalendarIcon, DecimalsArrowRightIcon, HashIcon, Link2Icon, MailIcon, PowerIcon, TypeIcon } from "lucide-react";
import { DATA_TYPES } from "../types";

export const dtypes = [
  {
    name: "Number",
    dtype: DATA_TYPES.INT,
    icon: <HashIcon />
  },
  {
    name: "String",
    dtype: DATA_TYPES.STRING,
    icon: <TypeIcon />
  },
  {
    name: "Float",
    dtype: DATA_TYPES.FLOAT,
    icon: <DecimalsArrowRightIcon />
  },
  {
    name: "Boolean",
    dtype: DATA_TYPES.BOOL,
    icon: <PowerIcon />
  },
  {
    name: "Date Time",
    dtype: DATA_TYPES.DateTime,
    icon: <CalendarIcon />
  },
  {
    name: "Email",
    dtype: DATA_TYPES.EMAIL,
    icon: <MailIcon />
  },
  {
    name: "URL",
    dtype: DATA_TYPES.URL,
    icon: <Link2Icon />
  }
]