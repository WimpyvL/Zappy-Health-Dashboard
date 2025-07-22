"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const handleYearChange = (value: string) => {
    const newDate = new Date(props.month || new Date());
    newDate.setFullYear(parseInt(value, 10));
    props.onMonthChange?.(newDate);
  };

  const handleMonthChange = (value: string) => {
    const newDate = new Date(props.month || new Date());
    newDate.setMonth(parseInt(value, 10));
    props.onMonthChange?.(newDate);
  };
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: ({ displayMonth }) => {
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            return (
              <div className="flex justify-between items-center w-full px-2">
                <Select
                    value={displayMonth.getMonth().toString()}
                    onValueChange={handleMonthChange}
                >
                    <SelectTrigger className="w-[120px] focus:ring-primary">
                    <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-48">
                            {months.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>{month}</SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
                <Select
                    value={displayMonth.getFullYear().toString()}
                    onValueChange={handleYearChange}
                >
                    <SelectTrigger className="w-[100px] focus:ring-primary">
                    <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-48">
                        {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
              </div>
            );
        },
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
