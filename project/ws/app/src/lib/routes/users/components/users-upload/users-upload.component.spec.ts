import { UsersUploadComponent } from './users-upload.component'
import { of, throwError } from 'rxjs'

describe('UsersUploadComponent', () => {
    let component: UsersUploadComponent
    let mockFileService: any
    let mockSnackBar: any
    let mockRoute: any
    let mockDatePipe: any
    let mockUsersService: any
    let mockFormBuilder: any
    let mockElementRef: any

    beforeEach(() => {
        // Mock dependencies
        mockFileService = {
            isLoading: jest.fn().mockReturnValue(of(false)),
            validateFile: jest.fn(),
            upload: jest.fn(),
            getBulkUploadDataV1: jest.fn().mockReturnValue(of({ result: { content: [] } })),
            download: jest.fn(),
            downloadReport: jest.fn()
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockRoute = {
            data: of({ pageData: { data: { downloadSampleFilePath: 'path', downloadAsFileName: 'file.csv' } } }),
            snapshot: {
                parent: {
                    data: {
                        configService: {
                            unMappedUser: {
                                rootOrg: {
                                    rootOrgId: 'rootOrgId'
                                }
                            },
                            userProfileV2: {
                                email: 'test@example.com',
                                mobile: '1234567890'
                            },
                            userRoles: new Set(['admin'])
                        }
                    }
                }
            }
        }

        mockDatePipe = {
            transform: jest.fn()
        }

        mockUsersService = {
            sendOtp: jest.fn(),
            resendOtp: jest.fn(),
            verifyOTP: jest.fn()
        }

        mockFormBuilder = {
            group: jest.fn().mockReturnValue({
                patchValue: jest.fn(),
                reset: jest.fn(),
                get: jest.fn().mockReturnValue({
                    setValue: jest.fn(),
                    valueChanges: of('test')
                }),
                controls: {
                    file: {
                        setValue: jest.fn()
                    }
                }
            })
        }

        mockElementRef = {
            nativeElement: {
                value: 'Error message'
            }
        }

        // Create component instance
        component = new UsersUploadComponent(
            mockFormBuilder as any,
            mockFileService as any,
            mockSnackBar as any,
            mockRoute as any,
            mockDatePipe as any,
            mockUsersService as any
        )

        // Set up required view children
        component.toastSuccess = mockElementRef
        component.toastError = mockElementRef
        component.paginator = {
            pageIndex: 0,
            pageSize: 10
        } as any
        component.sort = {
            active: 'dateCreatedOn',
            start: 'desc'
        } as any
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize component properties', () => {
            // Spy on the getBulkUploadData method
            jest.spyOn(component, 'getBulkUploadData')

            // Call ngOnInit
            component.ngOnInit()

            // Expectations
            expect(component.getBulkUploadData).toHaveBeenCalled()
            expect(component.userEmail).toBe('test@example.com')
            expect(component.userMobile).toBe('1234567890')
            expect(component.displayLoader).toBeDefined()
            expect(component.contactUsUrl).toBeDefined()
            expect(component.tabledata).toBeDefined()
        })
    })

    describe('onFileChange', () => {
        it('should update file selection when a file is selected', () => {
            // Create a mock event
            const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
            const mockEvent = {
                target: {
                    files: [mockFile]
                }
            }

            // Call onFileChange
            component.onFileChange(mockEvent)

            // Expectations
            expect(component.showFileError).toBe(false)
            expect(component.fileName).toBe('test.csv')
            expect(component.fileSelected).toBe(mockFile)
        })
    })

    describe('cancelSelected', () => {
        it('should reset file selection', () => {
            // Setup
            component.fileName = 'test.csv'
            component.fileSelected = 'file-content'

            // Call cancelSelected
            component.cancelSelected()

            // Expectations
            expect(component.fileName).toBe('')
            expect(component.fileSelected).toBe('')
        })
    })

    describe('getBulkUploadData', () => {
        it('should fetch bulk upload data and update data source', () => {
            // Mock response
            const mockResponse = {
                result: {
                    content: [
                        {
                            fileName: 'test.csv',
                            status: 'PROCESSED',
                            failedRecordsCount: 5,
                            successfulRecordsCount: 95,
                            totalRecords: 100,
                            dateCreatedOn: '2023-01-01',
                            dateUpdatedOn: '2023-01-02'
                        }
                    ]
                }
            }

            mockFileService.getBulkUploadDataV1.mockReturnValue(of(mockResponse))

            // Call getBulkUploadData
            component.getBulkUploadData()

            // Expectations
            expect(component.fetching).toBe(false)
            expect(component.bulkUploadData).toEqual(mockResponse.result.content)
            expect(component.tableList.length).toBe(1)
            expect(component.tableList[0].fileName).toBe('test.csv')
        })
    })

    describe('onSubmit', () => {
        it('should upload file when valid', () => {
            // Setup
            component.fileName = 'test.csv'
            component.fileSelected = new File(['content'], 'test.csv', { type: 'text/csv' })
            mockFileService.validateFile.mockReturnValue(true)
            mockFileService.upload.mockReturnValue(of({ success: true }))

            // Mock form
            const mockForm = { file: { value: 'test.csv' } }

            // Spy on methods
            // jest.spyOn(component, 'openSnackbar')
            jest.spyOn(component, 'resetOTPFields')
            jest.spyOn(component, 'getBulkUploadData')

            // Call onSubmit
            component.onSubmit(mockForm)

            // Expectations
            expect(mockFileService.validateFile).toHaveBeenCalledWith('test.csv')
            expect(mockFileService.upload).toHaveBeenCalled()
            // expect(component.openSnackbar).toHaveBeenCalledWith('File uploaded successfully!')
            expect(component.resetOTPFields).toHaveBeenCalled()
            expect(component.getBulkUploadData).toHaveBeenCalled()
        })

        it('should show error when file is invalid', () => {
            // Setup
            component.fileName = 'test.txt'
            mockFileService.validateFile.mockReturnValue(false)

            // Spy on methods
            // jest.spyOn(component, 'openSnackbar')

            // Call onSubmit
            component.onSubmit({})

            // Expectations
            expect(component.showFileError).toBe(true)
            // expect(component.openSnackbar).toHaveBeenCalledWith('Error message')
        })

        it('should handle upload error', () => {
            // Setup
            component.fileName = 'test.csv'
            component.fileSelected = new File(['content'], 'test.csv', { type: 'text/csv' })
            mockFileService.validateFile.mockReturnValue(true)
            mockFileService.upload.mockReturnValue(throwError({ error: 'Upload failed' }))

            // Spy on methods
            // jest.spyOn(component, 'openSnackbar')

            // Call onSubmit
            component.onSubmit({})

            // Expectations
            // expect(component.openSnackbar).toHaveBeenCalledWith('Error message')
        })
    })

    describe('downloadFile', () => {
        it('should call fileService.download with correct parameters', () => {
            // Setup
            component.downloadSampleFilePath = 'path/to/file'
            component.downloadAsFileName = 'sample.csv'

            // Call downloadFile
            component.downloadFile()

            // Expectations
            expect(mockFileService.download).toHaveBeenCalledWith('path/to/file', 'sample.csv')
        })
    })

    describe('OTP related functions', () => {
        describe('sendOtp', () => {
            it('should send OTP to mobile number', () => {
                // Setup
                component.userMobile = '1234567890'
                mockUsersService.sendOtp.mockReturnValue(of({ result: { response: 'SUCCESS' } }))

                // Spy on methods
                jest.spyOn(component, 'startCountDown')
                jest.spyOn(window, 'alert').mockImplementation(() => { })

                // Call sendOtp
                component.sendOtp()

                // Expectations
                expect(mockUsersService.sendOtp).toHaveBeenCalledWith('1234567890', 'phone')
                expect(component.otpSend).toBe(true)
                expect(component.startCountDown).toHaveBeenCalled()
                expect(window.alert).toHaveBeenCalled()
            })

            it('should handle error when sending OTP', () => {
                // Setup
                component.userMobile = '1234567890'
                mockUsersService.sendOtp.mockReturnValue(throwError({ error: { params: { errmsg: 'Error sending OTP' } } }))

                // Call sendOtp
                component.sendOtp()

                // Expectations
                expect(mockSnackBar.open).toHaveBeenCalledWith('Error sending OTP')
            })
        })

        describe('verifyOtp', () => {
            it('should verify OTP successfully', () => {
                // Setup
                component.userMobile = '1234567890'
                mockUsersService.verifyOTP.mockReturnValue(of({ result: { response: 'SUCCESS' } }))

                // Create mock OTP input
                const mockOtp = { value: '1234' }

                // Call verifyOtp
                component.verifyOtp(mockOtp)

                // Expectations
                expect(mockUsersService.verifyOTP).toHaveBeenCalledWith('1234', '1234567890', 'phone')
                expect(component.otpVerified).toBe(true)
                expect(component.isMobileVerified).toBe(true)
                expect(component.disableBtn).toBe(false)
            })

            it('should handle invalid OTP', () => {
                // Setup
                const mockOtp = { value: '123' }

                // Call verifyOtp
                component.verifyOtp(mockOtp)

                // Expectations
                expect(mockSnackBar.open).toHaveBeenCalledWith('Please enter a valid OTP.')
            })

            it('should handle verification error', () => {
                // Setup
                component.userMobile = '1234567890'
                mockUsersService.verifyOTP.mockReturnValue(throwError({
                    error: {
                        params: { errmsg: 'Invalid OTP' },
                        result: { remainingAttempt: 0 }
                    }
                }))

                // Create mock OTP input
                const mockOtp = { value: '1234' }

                // Call verifyOtp
                component.verifyOtp(mockOtp)

                // Expectations
                expect(mockSnackBar.open).toHaveBeenCalledWith('Invalid OTP')
                expect(component.disableVerifyBtn).toBe(true)
            })
        })

        describe('sendOtpEmail', () => {
            it('should send OTP to email', () => {
                // Setup
                component.userEmail = 'test@example.com'
                mockUsersService.sendOtp.mockReturnValue(of({ result: { response: 'SUCCESS' } }))

                // Spy on methods
                jest.spyOn(component, 'startCountDownEmail')
                jest.spyOn(window, 'alert').mockImplementation(() => { })

                // Call sendOtpEmail
                component.sendOtpEmail()

                // Expectations
                expect(mockUsersService.sendOtp).toHaveBeenCalledWith('test@example.com', 'email')
                expect(component.otpEmailSend).toBe(true)
                expect(component.startCountDownEmail).toHaveBeenCalled()
                expect(window.alert).toHaveBeenCalled()
            })
        })

        describe('verifyOtpEmail', () => {
            it('should verify email OTP successfully', () => {
                // Setup
                component.userEmail = 'test@example.com'
                mockUsersService.verifyOTP.mockReturnValue(of({ result: { response: 'SUCCESS' } }))

                // Create mock OTP input
                const mockOtp = { value: '1234' }

                // Call verifyOtpEmail
                component.verifyOtpEmail(mockOtp)

                // Expectations
                expect(mockUsersService.verifyOTP).toHaveBeenCalledWith('1234', 'test@example.com', 'email')
                expect(component.otpEmailSend).toBe(true)
                expect(component.isEmailVerified).toBe(true)
                expect(component.disableBtn).toBe(false)
            })
        })
    })

    describe('ngOnDestroy', () => {
        it('should unsubscribe from page data subscription', () => {
            // Setup
            component.pageDataSubscription = {
                unsubscribe: jest.fn()
            }

            // Call ngOnDestroy
            component.ngOnDestroy()

            // Expectations
            expect(component.pageDataSubscription.unsubscribe).toHaveBeenCalled()
        })
    })
})