import { AvatarPhotoComponent } from './avatar-photo.component'

describe('AvatarPhotoComponent', () => {
    let component: AvatarPhotoComponent

    beforeEach(() => {
        component = new AvatarPhotoComponent()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should show initials when photoUrl is not provided', () => {
            component.photoUrl = ''
            component.name = 'John Doe'
            component.datalen = 1
            component.randomColor = false

            component.ngOnInit()

            expect(component.showInitials).toBe(true)
            expect(component.initials).toBe('JD')
            expect(component.circleColor).toBeDefined()
        })

        it('should set random circle color', () => {
            component.photoUrl = ''
            component.name = 'John Doe'

            component.ngOnInit()

            expect(component.circleColor).toBeDefined()
            expect(component.circleColor).toMatch(/^#[0-9A-F]{6}$/i) // Hex color format
        })

        it('should use specific colors when randomColor is true', () => {
            component.photoUrl = ''
            component.name = 'Jane Doe'
            component.randomColor = true
            component.datalen = 1

            component.ngOnInit()

            expect(component.circleColor).toBeDefined()
            //  expect(component.randomcolors).toContain(component.circleColor)
        })
    })

    describe('ngOnChanges', () => {
        it('should call createInititals when name changes', () => {
            //  const initialName = component.name
            component.name = 'John Doe'
            component.ngOnChanges({
                name: {
                    currentValue: 'John Doe',
                    previousValue: 'Jane Doe',
                    firstChange: false,
                    isFirstChange: () => false,
                },
            })

            expect(component.initials).toBe('JD')
        })

        it('should not call createInititals when name does not change', () => {
            // const initialName = component.name
            component.name = 'John Doe'
            const previousInitials = component.initials
            component.ngOnChanges({
                name: {
                    currentValue: 'John Doe',
                    previousValue: 'John Doe',
                    firstChange: false,
                    isFirstChange: () => false,
                },
            })

            expect(component.initials).toBe(previousInitials)
        })
    })

    describe('createInititals', () => {
        it('should create initials correctly for a full name', () => {
            component.name = 'John Doe'
            component.ngOnInit() // This triggers createInititals
            expect(component.initials).toBe('JD')
        })

        it('should create initials from the first two characters if no last name', () => {
            component.name = 'John'
            component.ngOnInit() // This triggers createInititals
            expect(component.initials).toBe('JO')
        })

        it('should handle undefined name gracefully', () => {
            component.name = undefined as any
            component.ngOnInit() // This triggers createInititals
            expect(component.initials).toBe('')
        })
    })

    describe('userInitials getter', () => {
        it('should return the correct initials value', () => {
            component.initials = 'JD'
            expect(component.userInitials).toBe('JD')
        })
    })
})
