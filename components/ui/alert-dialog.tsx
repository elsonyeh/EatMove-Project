"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

interface AlertDialogContentProps {
    className?: string
    children: React.ReactNode
}

interface AlertDialogHeaderProps {
    className?: string
    children: React.ReactNode
}

interface AlertDialogFooterProps {
    className?: string
    children: React.ReactNode
}

interface AlertDialogTitleProps {
    className?: string
    children: React.ReactNode
}

interface AlertDialogDescriptionProps {
    className?: string
    children: React.ReactNode
}

interface AlertDialogActionProps {
    className?: string
    onClick?: () => void
    children: React.ReactNode
}

interface AlertDialogCancelProps {
    className?: string
    onClick?: () => void
    children: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange?.(false)}
            />
            <div className="relative z-50">
                {children}
            </div>
        </div>
    )
}

const AlertDialogContent = ({ className, children }: AlertDialogContentProps) => (
    <div className={cn(
        "bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4",
        className
    )}>
        {children}
    </div>
)

const AlertDialogHeader = ({ className, children }: AlertDialogHeaderProps) => (
    <div className={cn("mb-4", className)}>
        {children}
    </div>
)

const AlertDialogFooter = ({ className, children }: AlertDialogFooterProps) => (
    <div className={cn("flex justify-end gap-2 mt-6", className)}>
        {children}
    </div>
)

const AlertDialogTitle = ({ className, children }: AlertDialogTitleProps) => (
    <h2 className={cn("text-lg font-semibold", className)}>
        {children}
    </h2>
)

const AlertDialogDescription = ({ className, children }: AlertDialogDescriptionProps) => (
    <p className={cn("text-sm text-muted-foreground mt-2", className)}>
        {children}
    </p>
)

const AlertDialogAction = ({ className, onClick, children }: AlertDialogActionProps) => (
    <Button
        className={cn("", className)}
        onClick={onClick}
    >
        {children}
    </Button>
)

const AlertDialogCancel = ({ className, onClick, children }: AlertDialogCancelProps) => (
    <Button
        variant="outline"
        className={cn("", className)}
        onClick={onClick}
    >
        {children}
    </Button>
)

const AlertDialogTrigger = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
)

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} 