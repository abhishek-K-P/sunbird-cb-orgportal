import { AppGalleryComponent } from './app-gallery.component'
import { of } from 'rxjs'

jest.mock('@sunbird-cb/utils') // Mock the ValueService
jest.mock('@angular/router')  // Mock ActivatedRoute

describe('AppGalleryComponent', () => {
    let component: AppGalleryComponent
    let mockActivatedRoute: any
    let mockValueService: any

    beforeEach(() => {
        // Mock the dependencies
        mockActivatedRoute = {
            data: of({
                eventdata: {
                    data: {
                        Home: 'home-data',
                        Gallery: [
                            ['https://www.gstatic.com/webp/gallery/5.webp', 'https://www.gstatic.com/webp/gallery/1.webp'],
                            ['https://www.gstatic.com/webp/gallery/3.webp', 'https://www.gstatic.com/webp/gallery/4.webp']
                        ]
                    }
                }
            })
        }
        mockValueService = {
            isLtMedium$: of(false), // Simulating the observable behavior
        }

        // Create the component
        component = new AppGalleryComponent(mockActivatedRoute, mockValueService)
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should subscribe to isLtMedium$ and update noOfCol', () => {
        component.ngOnInit()
        expect(component.noOfCol).toBe(2) // Because isLtMedium$ is false
    })

    it('should handle route data and update imageData and data properties', () => {
        component.ngOnInit()
        expect(component.data).toBe('home-data')
        expect(component.imageData).toEqual([
            ['https://www.gstatic.com/webp/gallery/5.webp', 'https://www.gstatic.com/webp/gallery/1.webp'],
            ['https://www.gstatic.com/webp/gallery/3.webp', 'https://www.gstatic.com/webp/gallery/4.webp']
        ])
    })

    it('should set error to true when there is no eventdata or error in route data', () => {
        mockActivatedRoute.data = of({ eventdata: { error: true } })
        component.ngOnInit()
        expect(component.error).toBe(true)
    })

    it('should unsubscribe on ngOnDestroy', () => {
        const unsubscribeSpy = jest.spyOn(component.screenSubscription!, 'unsubscribe')
        component.ngOnDestroy()
        expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should slide to the correct index when slideTo is called', () => {
        component.imageGallery = ['image1', 'image2', 'image3']

        component.slideTo(1)
        expect(component.currentIndex).toBe(1)

        component.slideTo(5)
        expect(component.currentIndex).toBe(0)

        component.slideTo(-1)
        expect(component.currentIndex).toBe(2) // Wrap around to the last index
    })

    it('should open gallery and set imageGallery when openGallery is called', () => {
        component.openGallery(true, ['image1', 'image2'])
        expect(component.isOpened).toBe(true)
        expect(component.imageGallery).toEqual(['image1', 'image2'])

        component.openGallery(false)
        expect(component.isOpened).toBe(false)
        expect(component.imageGallery).toEqual([])
    })
})
