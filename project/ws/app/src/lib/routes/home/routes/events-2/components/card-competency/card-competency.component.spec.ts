import { CardCompetencyComponent } from './card-competency.component'

// Mock animations (since we don't need them for the unit test)
jest.mock('@angular/animations', () => ({
  trigger: jest.fn(),
  state: jest.fn(),
  style: jest.fn(),
  animate: jest.fn(),
  transition: jest.fn(),
}))

describe('CardCompetencyComponent', () => {
  let component: CardCompetencyComponent

  beforeEach(() => {
    component = new CardCompetencyComponent()
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with default values', () => {
    expect(component.isExpanded).toBe(false)
    expect(component.theme).toEqual([])
    expect(component.competencyArea).toBe('')
  })

  it('should toggle isExpanded state when handleToggleSize is called', () => {
    expect(component.isExpanded).toBe(false) // Initial state

    component.handleToggleSize('viewMore')
    expect(component.isExpanded).toBe(true) // After first toggle

    component.handleToggleSize('viewMore')
    expect(component.isExpanded).toBe(false) // After second toggle
  })

  it('should set the correct theme input', () => {
    const mockTheme = ['dark', 'blue']
    component.theme = mockTheme
    expect(component.theme).toEqual(mockTheme)
  })

  it('should set the correct competencyArea input', () => {
    const mockCompetencyArea = 'Software Development'
    component.competencyArea = mockCompetencyArea
    expect(component.competencyArea).toBe(mockCompetencyArea)
  })

})
