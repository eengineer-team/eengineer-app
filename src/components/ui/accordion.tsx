import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-[#2A2118]/10 last:border-b-0', className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex w-full items-start gap-4 py-5 text-left',
        'font-sans text-[0.9375rem] font-semibold text-[#2A2118]',
        'hover:text-corn-700 transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-corn-700/40 rounded-sm',
        className
      )}
      {...props}
    >
      {/* Single Plus — rotates 45° to become ×, via .acc-icon CSS class */}
      <span className="acc-icon mt-[0.125rem] w-4 h-4 flex items-center justify-center text-corn-700">
        <Plus size={14} strokeWidth={2.2} />
      </span>
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  // acc-content: the grid wrapper that animates rows 0fr→1fr
  <AccordionPrimitive.Content
    ref={ref}
    className="acc-content"
    {...props}
  >
    {/* acc-content-body: overflow:hidden clip layer */}
    <div className="acc-content-body">
      {/* acc-answer: text fade-in with delay */}
      <div className={cn('acc-answer pl-8 pb-5 font-sans text-[0.875rem] leading-[1.75] text-[#2A2118]', className)}>
        {children}
      </div>
    </div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
