'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DashboardCardProps {
  id: string
  children: React.ReactNode
  colSpan?: string
}

function SortableCard({ id, children, colSpan = 'col-span-1' }: DashboardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`hover:scale-[1.02] active:scale-100 transition-transform duration-200 ${colSpan}`}
    >
      {children}
    </div>
  )
}

interface DashboardGridClientProps {
  cards: Array<{
    id: string
    component: React.ReactNode
    colSpan?: string
  }>
  showResetButton?: boolean
  onReset?: () => void
}

export function DashboardGridClient({ cards, showResetButton = true }: DashboardGridClientProps) {
  const [items, setItems] = useState(cards)
  const [mounted, setMounted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleReset = () => {
    localStorage.removeItem('dashboard-layout')
    setItems(cards)
  }

  // Load saved layout from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedLayout = localStorage.getItem('dashboard-layout')
    if (savedLayout) {
      try {
        const savedIds = JSON.parse(savedLayout)
        // Reorder items based on saved layout
        const reorderedItems = savedIds
          .map((id: string) => cards.find((card) => card.id === id))
          .filter(Boolean)
        
        // Add any new cards that weren't in the saved layout
        const newCards = cards.filter(
          (card) => !savedIds.includes(card.id)
        )
        
        setItems([...reorderedItems, ...newCards])
      } catch (error) {
        console.error('Error loading dashboard layout:', error)
        setItems(cards)
      }
    } else {
      setItems(cards)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save layout to localStorage whenever it changes
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Save to localStorage
        const itemIds = newItems.map((item) => item.id)
        localStorage.setItem('dashboard-layout', JSON.stringify(itemIds))
        
        return newItems
      })
    }
  }

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.id} className={card.colSpan || 'col-span-1'}>
            {card.component}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showResetButton && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="text-sm text-gray-400 hover:text-white transition-colors underline"
          >
            Reset to default layout
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {items.map((card) => (
              <SortableCard key={card.id} id={card.id} colSpan={card.colSpan}>
                {card.component}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

