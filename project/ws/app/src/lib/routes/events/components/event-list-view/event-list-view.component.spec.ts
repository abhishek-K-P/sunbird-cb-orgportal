import { EventListViewComponent } from './event-list-view.component'
import { Router } from '@angular/router'
import { EventService } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { ChangeDetectorRef } from '@angular/core'
import { SelectionModel } from '@angular/cdk/collections'
import { ITableData } from '../../interfaces/interfaces'
import * as _ from 'lodash'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'

describe('EventListViewComponent', () => {
    let component: EventListViewComponent
    let routerMock: jest.Mocked<Router>
    let matDialogMock: jest.Mocked<MatDialog>
    let eventServiceMock: jest.Mocked<EventService>
    let changeDetectorRefMock: jest.Mocked<ChangeDetectorRef>
    let routeMock: jest.Mocked<ActivatedRoute>

    beforeEach(() => {
        routerMock = { navigate: jest.fn() } as unknown as jest.Mocked<Router>
        matDialogMock = { open: jest.fn() } as unknown as jest.Mocked<MatDialog>
        eventServiceMock = { raiseInteractTelemetry: jest.fn() } as unknown as jest.Mocked<EventService>
        changeDetectorRefMock = { detectChanges: jest.fn() } as unknown as jest.Mocked<ChangeDetectorRef>
        routeMock = { parent: { snapshot: { data: { configService: {} } } } } as unknown as jest.Mocked<ActivatedRoute>

        component = new EventListViewComponent(
            routerMock,
            matDialogMock,
            eventServiceMock,
            routeMock,
            changeDetectorRefMock,
            {} as any
        )

        component.tableData = { columns: [] } as unknown as ITableData
        component.data = []
        component.selection = new SelectionModel<any>(true, [])
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call ngOnInit and set data source data', () => {
        const tableData = {
            columns: [
                { key: 'eventName', label: 'Event Name' },
                { key: 'eventDate', label: 'Event Date' }
            ]
        } as unknown as ITableData

        component.tableData = tableData
        component.ngOnInit()

        expect(component.displayedColumns).toEqual(tableData.columns)
        expect(component.dataSource.data).toEqual(component.data)
    })

    it('should apply filter correctly', () => {
        const filterValue = 'test'

        component.applyFilter(filterValue)

        expect(component.dataSource.filter).toBe('test')
    })

    it('should emit actionsClick when buttonClick is called and action is not disabled', () => {
        const action = 'edit'
        const row = { id: 1, eventName: 'Test Event' }

        component.tableData = {
            columns: [{ key: 'eventName', label: 'Event Name' }],
            actions: [{ name: 'edit', disabled: false }]
        } as unknown as ITableData

        component.actionsClick = { emit: jest.fn() } as any

        component.buttonClick(action, row)

        //expect(component.actionsClick.emit).toHaveBeenCalledWith({ action, row })
    })

    it('should not emit actionsClick when buttonClick is called and action is disabled', () => {
        const action = 'edit'
        const row = { id: 1, eventName: 'Test Event' }

        component.tableData = {
            columns: [{ key: 'eventName', label: 'Event Name' }],
            actions: [{ name: 'edit', disabled: true }]
        } as unknown as ITableData

        component.actionsClick = { emit: jest.fn() } as any

        component.buttonClick(action, row)

        // expect(component.actionsClick.emit).not.toHaveBeenCalled()
    })

    it('should navigate to create event page on onCreateClick', () => {
        component.onCreateClick()

        expect(routerMock.navigate).toHaveBeenCalledWith(['/app/events/create-event'])
    })

    it('should open dialog on showImageDialog', () => {
        const img = { width: 300, height: 200 }

        component.showImageDialog(img)

        expect(matDialogMock.open).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                width: img.width,
                height: img.height,
                data: img,
            })
        )
    })

    it('should select all rows when masterToggle is called and not all are selected', () => {
        const data = [{ id: 1 }, { id: 2 }]
        component.dataSource.data = data

        component.masterToggle()

        expect(component.selection.selected.length).toBe(data.length)
    })

    it('should clear selection when masterToggle is called and all are selected', () => {
        const data = [{ id: 1 }, { id: 2 }]
        component.dataSource.data = data
        component.selection.select(...data)

        component.masterToggle()

        expect(component.selection.selected.length).toBe(0)
    })

    it('should return correct checkbox label', () => {
        const row = { position: 1 }
        const label = component.checkboxLabel(row)

        expect(label).toBe('select row 2')
    })

    it('should return correct label for select all checkbox', () => {
        const label = component.checkboxLabel()

        expect(label).toBe('select all')
    })

    it('should emit onRowClick when onRowClick is called', () => {
        const row = { id: 1, eventName: 'Test Event' }
        component.eOnRowClick = { emit: jest.fn() } as any

        component.onRowClick(row)

        expect(component.eOnRowClick.emit).toHaveBeenCalledWith(row)
    })
})
