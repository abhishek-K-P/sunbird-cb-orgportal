import { EventBannerComponent } from './event-banner.component'
import { Router, ActivatedRoute } from '@angular/router'
import { ChangeDetectorRef } from '@angular/core'
import { Subscription } from 'rxjs'

// Mocks
const mockRouter = {
    navigate: jest.fn(),
}

const mockActivatedRoute = {}

const mockChangeDetectorRef = {
    detectChanges: jest.fn(),
}

describe('EventBannerComponent', () => {
    let component: EventBannerComponent

    beforeEach(() => {
        component = new EventBannerComponent(
            mockRouter as unknown as Router,
            mockActivatedRoute as unknown as ActivatedRoute,
            mockChangeDetectorRef as unknown as ChangeDetectorRef
        )

        component.data = {
            SessionCards: {
                Sessions: {
                    1: { SessionStartTime: '2025-02-28T12:00:00Z' },
                    2: { SessionStartTime: '2025-02-28T14:00:00Z' },
                },
            },
        }
        component.totalEvent = 2
        component.isRegisteredUser = false
    })

    // Test ngOnInit
    it('should call ngOnInit and set the session times', () => {
        const spy = jest.spyOn(component, 'calculateTime')
        component.ngOnInit()

        expect(spy).toHaveBeenCalled()
        expect(component.sessionTime.length).toBe(2)  // We have two sessions in the mock data
    })

    // Test calculateTime
    it('should calculate session times correctly', () => {
        component.calculateTime()

        expect(component.sessionTime.length).toBe(2)
        expect(component.sessionTime[0]).toBeGreaterThan(0)  // The difference in time should be positive
    })

    // Test convertMinutes
    it('should convert minutes to hours and minutes correctly', () => {
        const result = component.convertMinutes(7200000)  // 2 hours in milliseconds
        expect(result.hours).toBe(2)
        expect(result.mins).toBe(0)
    })

    // Test slideTo
    it('should change currentIndex when slideTo is called with valid index', () => {
        component.slideTo(1)
        expect(component.currentIndex).toBe(1)
    })

    it('should not change currentIndex when slideTo is called with invalid index', () => {
        component.slideTo(5)  // Invalid index
        expect(component.currentIndex).toBe(0)  // Should not change
    })

    // Test onClickRegister
    it('should navigate to "sessions" route when onClickRegister is called', () => {
        component.onClickRegister()
        expect(mockRouter.navigate).toHaveBeenCalledWith(['sessions'], { relativeTo: mockActivatedRoute })
        expect(component.isRegisteredUser).toBe(true)  // It should toggle the registration status
    })

    // Test ngOnDestroy
    it('should unsubscribe from currentSubscription in ngOnDestroy', () => {
        const unsubscribeSpy = jest.spyOn(Subscription.prototype, 'unsubscribe')
        //  component.currentSubscription = new Subscription()

        component.ngOnDestroy()

        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    // Test timer logic in ngOnInit
    it('should update allRemainingTime on timer tick', () => {
        jest.useFakeTimers()

        component.ngOnInit()

        // Initial values
        expect(component.allRemainingTime.length).toBe(2)

        // Advance timer by 1 minute (60,000 ms)
        jest.advanceTimersByTime(60000)

        // Check if the time has been updated
        expect(component.allRemainingTime[0].hours).toBeLessThan(2)  // The time should be reduced by 1 minute
        jest.useRealTimers()
    })

    // Test the empty state for allRemainingTime if no sessions are provided
    it('should handle case with no session time data', () => {
        component.data = { SessionCards: { Sessions: {} } }
        component.calculateTime()

        expect(component.sessionTime.length).toBe(0)
    })
})
