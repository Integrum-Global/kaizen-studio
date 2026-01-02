import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkeletonTableProps } from "../types";
import { Skeleton } from "./Skeleton";

export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  animate = true,
}: SkeletonTableProps) {
  return (
    <div className={cn("border rounded-lg", className)}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton variant="text" width="80%" animate={animate} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    variant="text"
                    width={colIndex === 0 ? "90%" : "70%"}
                    animate={animate}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
